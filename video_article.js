/**
 * 通用文章站采集源（多站点 + 发布页动态获取域名 + 自动选通）
 * ------------------------------------------------------------
 * 逻辑：
 *   1. 运行时先请求"发布页"（publish.json），拿到站点列表
 *      —— 每个站点配置多个候选域名
 *   2. 对每个站点逐个测通候选域名，第一个能访问的作为该站 host
 *   3. 影视仓里：分类 = 站点；搜索 = 全局（所有站点一起搜）
 *
 * 维护方式（域名挂了/新增站点）：
 *   - 只改发布页 publish.json 的 sites 数组，脚本本身不用动
 *   - 影视仓每次打开源都会重新读发布页并测通（会话内缓存）
 *
 * 站点结构要求（Typecho 文章站）：
 *   - 列表:  / 或 /page/N/   HTML 含 <div class="video-item"> 块
 *           内部 href="/archives/数字/" + alt="标题"
 *   - 搜索:  POST /index/search_article  body=word=关键词&page=N&oauth_type=h5
 *           返回 JSON(data/result/list/html) 或 HTML
 *   - 详情:  /archives/数字/  HTML 含 data-video_title="..." + config='{json}'
 *           (cfg.video.url 为 HLS 直链)
 *
 * 配置行（影视仓，一条 [js] 源）：
 *   api:  https://gh-proxy.org/https://raw.githubusercontent.com/jixiejishu/tvboxzb/master/lib/drpy2.min.js
 *   ext:  https://feigeys.pages.dev/video_article.js
 */

// 发布页地址（json）。部署后默认指向 feigeys.pages.dev，可自行改成自己的发布页地址
var PUBLISH_URL = 'https://gh-proxy.org/https://raw.githubusercontent.com/BlackJNG/TVBox_HL/main/publish.json';

var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14';
var FETCH_PARAMS = { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } };

// ---------- 站点管理：从发布页获取 + 测通选域名 ----------
var SITES = [];          // [{name, host, domains}]
var SITES_LOADED = false;

function loadSites() {
    if (SITES_LOADED) return;
    SITES_LOADED = true;
    try {
        var text = fetch(PUBLISH_URL, FETCH_PARAMS);
        var d = JSON.parse(text);
        var sites = d.sites || [];
        for (var i = 0; i < sites.length; i++) {
            var s = sites[i];
            var domains = s.domains || [];
            var host = null;
            // 逐个测通：能返回页面即视为通
            for (var j = 0; j < domains.length; j++) {
                try {
                    var html = fetch(domains[j] + '/', FETCH_PARAMS);
                    if (html && html.length > 200) { host = domains[j]; break; }
                } catch (e) {}
            }
            if (host) SITES.push({ name: s.name || ('站点' + (i + 1)), host: host, domains: domains });
        }
    } catch (e) {}
}
function getSite(idx) {
    loadSites();
    idx = parseInt(idx || 0);
    return SITES[idx] || SITES[0] || null;
}

// ---------- 通用工具 ----------
function get(url) {
    try { return fetch(url, FETCH_PARAMS); } catch (e) { return ''; }
}
function post(url, body) {
    try {
        return fetch(url, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'User-Agent': UA,
                'Referer': url.split('/index/')[0] + '/'
            }
        });
    } catch (e) { return ''; }
}

// 列表解析：<div class="video-item"> 块 → [{href,title}]
function parseList(html) {
    var items = [];
    var blocks = html.split('<div class="video-item">');
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i].substring(0, 2000);
        var m = block.match(/href="(\/archives\/\d+\/)"/);
        if (!m) continue;
        var href = m[1];
        var t = block.match(/alt="([^"]+)"/);
        items.push({ href: href, title: t ? t[1] : href });
    }
    return items;
}

// 详情解析：data-video_title + config='{json}' → [{title, url, pic}]
function parseArticleVideos(html) {
    var configs = [];
    var titles = [];
    var re = /data-video_title="([^"]+)"/g, tm;
    while ((tm = re.exec(html)) !== null) titles.push(tm[1]);
    var cre = /config='([^']+)'/g, m, ti = 0;
    while ((m = cre.exec(html)) !== null) {
        try {
            var cfg = JSON.parse(m[1]);
            if (cfg && cfg.video && cfg.video.url) {
                configs.push({ title: titles[ti] || ('视频' + (ti + 1)), url: cfg.video.url, pic: cfg.video.pic || '' });
            }
        } catch (e) {}
        ti++;
    }
    return configs;
}

// 搜索结果统一成 [{href,title}]
function parseSearch(text) {
    var items = [];
    try {
        var data = JSON.parse(text);
        var d = data.data || data.result || data;
        if (typeof d === 'string') items = parseList(d);
        else if (Array.isArray(d)) {
            items = d.map(function (x) {
                var href = x.url || x.href || x.article_url;
                if (!href && x.id) href = '/archives/' + x.id + '/';
                return { href: href, title: x.title || x.name || x.article_title };
            });
        } else if (d && d.list) {
            items = d.list.map(function (x) {
                var href = x.url || x.href || x.article_url;
                if (!href && x.id) href = '/archives/' + x.id + '/';
                return { href: href, title: x.title || x.name || x.article_title };
            });
        } else if (d && d.html) {
            items = parseList(d.html);
        }
    } catch (e) {
        items = parseList(text);
    }
    return items;
}

// 某站点列表 → 影视仓条目（vod_id 带站点索引，供详情定位）
function siteListToVod(site, idx, items, remark) {
    var list = [];
    items.forEach(function (it) {
        list.push({ vod_id: idx + '|' + it.href, vod_name: it.title, vod_pic: '', vod_remarks: remark || site.name });
    });
    return list;
}

// ---------- TVBox 协议函数 ----------

// 首页：分类 = 站点列表；列表 = 第一个站点的首页
function homeContent() {
    loadSites();
    var classes = [];
    for (var i = 0; i < SITES.length; i++) classes.push({ type_id: String(i), type_name: SITES[i].name });
    var list = [];
    if (SITES.length > 0) {
        var site = SITES[0];
        var html = get(site.host + '/');
        list = siteListToVod(site, 0, parseList(html), site.name);
    }
    return { class: classes, list: list };
}

// 分类：fyclass = 站点索引, fypage = 页码
function categoryContent(fyclass, fypage) {
    loadSites();
    fypage = parseInt(fypage || 1);
    var site = getSite(fyclass);
    if (!site) return { list: [] };
    var idx = -1;
    for (var i = 0; i < SITES.length; i++) if (SITES[i] === site) { idx = i; break; }
    var url = fypage > 1 ? site.host + '/page/' + fypage + '/' : site.host + '/';
    var html = get(url);
    var list = siteListToVod(site, idx, parseList(html), site.name);
    return { list: list, page: fypage, pagecount: fypage + 1, limit: list.length, total: list.length };
}

// 详情：ids[0] = "站点索引|/archives/N/"
function detailContent(ids) {
    var raw = ids[0] || '';
    var parts = raw.split('|');
    var idx = parseInt(parts[0] || 0), path = parts[1] || raw;
    if (path.indexOf('http') === 0) { path = path.replace(/^https?:\/\/[^\/]+/, ''); }
    var site = getSite(idx);
    if (!site) return { list: [] };
    var html = get(site.host + path);
    var configs = parseArticleVideos(html);
    var from = [], urls = [];
    configs.forEach(function (c, i) {
        from.push('视频' + (i + 1));
        urls.push((c.title || '视频' + (i + 1)) + '$' + c.url);
    });
    return {
        list: [{
            vod_id: raw,
            vod_name: configs.length ? configs[0].title : path,
            vod_pic: configs.length ? configs[0].pic : '',
            vod_play_from: from.join('$$$'),
            vod_play_url: urls.join('#')
        }]
    };
}

// 搜索：全局（所有站点合并）
function searchContent(keyword) {
    keyword = keyword || '';
    loadSites();
    var list = [];
    for (var i = 0; i < SITES.length; i++) {
        var site = SITES[i];
        var body = 'word=' + encodeURIComponent(keyword) + '&page=1&oauth_type=h5';
        var text = post(site.host + '/index/search_article', body);
        var items = parseSearch(text);
        list = list.concat(siteListToVod(site, i, items, site.name));
    }
    return { list: list };
}

// 播放：HLS 直链直接返回
function playerContent(ids, flag, url) {
    return { url: url, from: flag };
}
