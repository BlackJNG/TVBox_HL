/**
 * 通用文章站采集源（手动填地址 + 影视仓调试日志版）
 * ------------------------------------------------------------
 * 与原版区别：
 *   1. 不再请求发布页(publish.json)、不再自动测通域名 —— 站点地址由你在下方 SITES 里手动填写
 *   2. 全程带调试日志(DEBUG)，影视仓"爬虫日志/运行日志"里可直接看到
 *   3. 关键节点会打印"抓到多少篇文章 / 抓到几个视频"，并在片单条目上标注条数
 *
 * 站点结构要求（Typecho 文章站，与原版一致）：
 *   - 列表:  / 或 /page/N/   HTML 含 <div class="video-item"> 块
 *           内部 href="/archives/数字/" + alt="标题"
 *   - 搜索:  POST /index/search_article  body=word=关键词&page=N&oauth_type=h5
 *   - 详情:  /archives/数字/  HTML 含 data-video_title="..." + config='{json}' (cfg.video.url 为 HLS 直链)
 *
 * 影视仓配置（一条 [js] 源）：
 *   api:  https://.../drpy2.min.js
 *   ext:  本 js 的访问地址
 */

// ===== 调试开关：true 打开调试日志；上线稳定后可改 false =====
var DEBUG = true;

// ===== 站点地址：在这里手动填写（自己填地址，不再自动取域名） =====
// 每个站点：name = 影视仓里显示的分类名；host = 站点根地址(结尾不要带 /)
// 想加几个就加几行，删掉用不到的站点即可。
var SITES = [
    { name: '站点1', host: 'https://jryck.vrlvlgvm.cc/' },
    { name: '站点2', host: 'https://scmiq.bvaglnax.cc/' }
    // , { name: '站点3', host: 'https://ds6r63epm75a1.cloudfront.net/' }
];

var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14';
var FETCH_PARAMS = { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } };

// ---------- 调试日志：兼容影视仓 log / print / console ----------
function dbg(msg) {
    if (!DEBUG) return;
    var line = '[video_article] ' + msg;
    try { if (typeof log === 'function') log(line); } catch (e) {}
    try { if (typeof print === 'function') print(line); } catch (e) {}
    try { if (typeof console !== 'undefined' && console.log) console.log(line); } catch (e) {}
}

function getSite(idx) {
    idx = parseInt(idx || 0);
    if (isNaN(idx) || idx < 0) idx = 0;
    return SITES[idx] || SITES[0] || null;
}

// ---------- 通用工具 ----------
function get(url) {
    dbg('GET ' + url);
    try {
        var r = fetch(url, FETCH_PARAMS);
        dbg('GET 返回长度 ' + (r ? r.length : 0));
        return r;
    } catch (e) {
        dbg('GET 异常: ' + e);
        return '';
    }
}
function post(url, body) {
    dbg('POST ' + url + '  body=' + body);
    try {
        var r = fetch(url, {
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
        dbg('POST 返回长度 ' + (r ? r.length : 0));
        return r;
    } catch (e) {
        dbg('POST 异常: ' + e);
        return '';
    }
}

// 列表解析：<div class="video-item"> 块 -> [{href,title}]
function parseList(html) {
    var items = [];
    if (!html) { dbg('parseList: 传入 HTML 为空'); return items; }
    var blocks = html.split('<div class="video-item">');
    dbg('parseList: 切出 video-item 块 ' + (blocks.length - 1) + ' 个');
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i].substring(0, 2000);
        var m = block.match(/href="(\/archives\/\d+\/)"/);
        if (!m) continue;
        var href = m[1];
        var t = block.match(/alt="([^"]+)"/);
        items.push({ href: href, title: t ? t[1] : href });
    }
    dbg('parseList: 解析出文章 ' + items.length + ' 篇');
    return items;
}

// 详情解析：data-video_title + config='{json}' -> [{title,url,pic}]
function parseArticleVideos(html) {
    var configs = [];
    var titles = [];
    if (!html) { dbg('parseArticleVideos: 传入 HTML 为空'); return configs; }
    var re = /data-video_title="([^"]+)"/g, tm;
    while ((tm = re.exec(html)) !== null) titles.push(tm[1]);
    var cre = /config='([^']+)'/g, m, ti = 0;
    while ((m = cre.exec(html)) !== null) {
        try {
            var cfg = JSON.parse(m[1]);
            if (cfg && cfg.video && cfg.video.url) {
                configs.push({ title: titles[ti] || ('视频' + (ti + 1)), url: cfg.video.url, pic: cfg.video.pic || '' });
            }
        } catch (e) { dbg('config JSON 解析失败: ' + e); }
        ti++;
    }
    dbg('parseArticleVideos: 抓到视频 ' + configs.length + ' 个');
    return configs;
}

// 搜索结果统一成 [{href,title}]
function parseSearch(text) {
    var items = [];
    if (!text) { dbg('parseSearch: 返回为空'); return items; }
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
    dbg('parseSearch: 解析出结果 ' + items.length + ' 条');
    return items;
}

// 某站点列表 -> 影视仓条目（vod_id 带站点索引，供详情定位；条目上标注抓到条数）
function siteListToVod(site, idx, items, remark, total) {
    var list = [];
    var t = (typeof total === 'number') ? total : items.length;
    items.forEach(function (it, k) {
        var rm = (remark || site.name);
        if (k === 0) rm = rm + '｜抓到' + t + '篇';   // 第一条带条数，片单里直接可见
        list.push({ vod_id: idx + '|' + it.href, vod_name: it.title, vod_pic: '', vod_remarks: rm });
    });
    return list;
}

// ---------- TVBox 协议函数 ----------

// 首页：分类 = 站点列表；列表 = 第一个站点的首页
function homeContent() {
    dbg('=== homeContent 开始，已配置站点 ' + SITES.length + ' 个 ===');
    SITES.forEach(function (s, i) { dbg('  站点[' + i + '] ' + s.name + ' -> ' + s.host); });
    var classes = [];
    for (var i = 0; i < SITES.length; i++) classes.push({ type_id: String(i), type_name: SITES[i].name });
    var list = [];
    if (SITES.length > 0) {
        var site = SITES[0];
        var html = get(site.host + '/');
        var items = parseList(html);
        dbg('首页(站点' + site.name + ')抓到文章 ' + items.length + ' 篇');
        list = siteListToVod(site, 0, items, site.name, items.length);
    } else {
        dbg('!! 未配置任何站点，请在脚本顶部 SITES 里手动填写地址');
    }
    return { class: classes, list: list };
}

// 分类：fyclass = 站点索引, fypage = 页码
function categoryContent(fyclass, fypage) {
    fypage = parseInt(fypage || 1);
    var site = getSite(fyclass);
    dbg('=== categoryContent 站点索引=' + fyclass + ' 页=' + fypage + ' ===');
    if (!site) { dbg('!! 找不到站点，返回空'); return { list: [] }; }
    var idx = -1;
    for (var i = 0; i < SITES.length; i++) if (SITES[i] === site) { idx = i; break; }
    var url = fypage > 1 ? site.host + '/page/' + fypage + '/' : site.host + '/';
    var html = get(url);
    var items = parseList(html);
    dbg('分类(' + site.name + ')第' + fypage + '页抓到文章 ' + items.length + ' 篇');
    var list = siteListToVod(site, idx, items, site.name, items.length);
    return { list: list, page: fypage, pagecount: fypage + 1, limit: list.length, total: list.length };
}

// 详情：ids[0] = "站点索引|/archives/N/"
function detailContent(ids) {
    var raw = ids[0] || '';
    var parts = raw.split('|');
    var idx = parseInt(parts[0] || 0), path = parts[1] || raw;
    if (path.indexOf('http') === 0) { path = path.replace(/^https?:\/\/[^\/]+/, ''); }
    var site = getSite(idx);
    dbg('=== detailContent id=' + raw + ' ===');
    if (!site) { dbg('!! 找不到站点'); return { list: [] }; }
    var html = get(site.host + path);
    var configs = parseArticleVideos(html);
    dbg('详情抓到视频 ' + configs.length + ' 个');
    var from = [], urls = [];
    configs.forEach(function (c, i) {
        from.push('视频' + (i + 1));
        urls.push((c.title || '视频' + (i + 1)) + '$' + c.url);
    });
    if (configs.length === 0) dbg('!! 详情页没解析到任何视频，检查该页是否含 config= 或 data-video_title');
    return {
        list: [{
            vod_id: raw,
            vod_name: configs.length ? configs[0].title : path,
            vod_pic: configs.length ? configs[0].pic : '',
            vod_play_from: from.join('623$'),
            vod_play_url: urls.join('#')
        }]
    };
}

// 搜索：全局（所有站点合并）
function searchContent(keyword) {
    keyword = keyword || '';
    dbg('=== searchContent 关键词=' + keyword + ' ===');
    var list = [];
    for (var i = 0; i < SITES.length; i++) {
        var site = SITES[i];
        var body = 'word=' + encodeURIComponent(keyword) + '&page=1&oauth_type=h5';
        var text = post(site.host + '/index/search_article', body);
        var items = parseSearch(text);
        dbg('搜索(' + site.name + ')抓到 ' + items.length + ' 条');
        list = list.concat(siteListToVod(site, i, items, site.name, items.length));
    }
    dbg('搜索合计 ' + list.length + ' 条');
    return { list: list };
}

// 播放：HLS 直链直接返回
function playerContent(ids, flag, url) {
    dbg('=== playerContent url=' + url + ' ===');
    if (!url) dbg('!! 播放地址为空');
    return { url: url, from: flag };
}
