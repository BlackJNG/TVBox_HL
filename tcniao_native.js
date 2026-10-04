// ========================================================
// TC鸟 - 影视仓原生 JS 规则（函数式）
// 注意: 配置里 api 必须留空 "", ext 指向本文件
// 列表: video-item 分割 + /archives/(\d+)/ 数字ID
// 详情: config='{...}' 全局循环, cfg.video.url / urls[0].url
// 搜索: POST /index/search_article + 翻页
// 改域名: 只改下方 HOST
// ========================================================

var HOST = 'https://tcniao.com';

// ---------- 公共: 列表解析 ----------
function parseList(html) {
    var items = html.split('<div class="video-item">');
    var videos = [];
    for (var i = 1; i < items.length; i++) {
        var block = items[i].substring(0, 2000);
        var idMatch = block.match(/href="\/archives\/(\d+)\//);
        if (!idMatch) continue;
        var vod_id = idMatch[1];
        var titleMatch = block.match(/alt="([^"]+)"/);
        var title = titleMatch ? titleMatch[1] : vod_id;
        var imgMatch = block.match(/src="(https?:\/\/[^"]+)"/);
        var pic = imgMatch ? imgMatch[1] : '';
        if (pic && pic.indexOf('http') !== 0) pic = HOST + pic;
        videos.push({
            vod_id: vod_id,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: 'TC鸟',
            type_name: 'TC鸟'
        });
    }
    return JSON.stringify({list: videos, page: 1, pagecount: 1, total: videos.length});
}

// ---------- 首页 ----------
function homeContent() {
    var html = request(HOST + '/');
    return parseList(html);
}

// ---------- 分类 ----------
function class_parse() {
    return JSON.stringify({class: [{type_id: 'home', type_name: '最新视频'}]});
}

// ---------- 一级(分类/分页) ----------
function classContent(tid, pg) {
    var url = HOST + (pg > 1 ? '/page/' + pg + '/' : '/');
    var html = request(url);
    return parseList(html);
}

// ---------- 详情(多视频循环切割) ----------
function detailContent(ids) {
    var id = ids[0];
    var url = HOST + '/archives/' + id + '/';
    var html = request(url);

    // 标题: data-video_title 或 h1
    var h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    var title = h1 ? h1[1].trim() : '文章播放';

    // 全部 config 循环（视频可能多个）
    var configRe = /config='([^']+)'/g;
    var titleRe = /data-video_title="([^"]+)"/g;
    var titles = [], m;
    while ((m = titleRe.exec(html)) !== null) titles.push(m[1]);

    var plays = [];
    var ti = 0;
    while ((m = configRe.exec(html)) !== null) {
        try {
            var cfg = JSON.parse(m[1]);
            var vu = '';
            if (cfg.video) {
                vu = cfg.video.url || '';
                if (!vu && cfg.video.urls && cfg.video.urls.length > 0) vu = cfg.video.urls[0].url;
            }
            if (vu) {
                var nm = titles[ti] || ('视频' + (ti + 1));
                plays.push(nm + '$' + vu);
            }
        } catch (e) {}
        ti++;
    }

    var pic = '';
    var picMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
    if (picMatch) pic = picMatch[1];
    else {
        var pm2 = html.match(/<meta[^>]*property="og:image"[^>]*content="(\/[^"]+)"/);
        if (pm2) pic = HOST + pm2[1];
    }

    var list = [{
        vod_id: id,
        vod_name: title,
        vod_pic: pic,
        type_name: 'TC鸟',
        vod_year: '',
        vod_area: '',
        vod_director: '',
        vod_actor: '',
        vod_content: HOST + '/archives/' + id + '/',
        vod_play_from: plays.length ? 'TC鸟' : '提示',
        vod_play_url: plays.length ? plays.join('#') : '无视频$$$'
    }];
    return JSON.stringify({list: list});
}

// ---------- 搜索(翻页) ----------
function searchContent(key, quick) {
    var pg = (typeof MY_PAGE !== 'undefined' && MY_PAGE) ? MY_PAGE : 1;
    var resp = post(HOST + '/index/search_article', {
        body: 'word=' + encodeURIComponent(key) + '&page=' + pg + '&oauth_type=h5'
    });
    var data = null;
    try { data = JSON.parse(resp); } catch (e) {}

    var items = [];
    if (data) {
        var dt = data.data || data.result || data;
        if (typeof dt === 'string') {
            var ps = dt.split('<div class="video-item">');
            for (var i = 1; i < ps.length; i++) {
                var b = ps[i].substring(0, 2000);
                var h = (b.match(/href="\/archives\/(\d+)\/"/) || [])[1];
                if (!h) continue;
                items.push({title: (b.match(/alt="([^"]+)"/) || [])[1] || h, url: h});
            }
        } else if (Array.isArray(dt)) {
            dt.forEach(function(x) {
                var href = x.url || x.href || x.article_url;
                if (!href && x.id) href = String(x.id);
                else if (href) {
                    var mm = href.match(/\/archives\/(\d+)\//);
                    if (mm) href = mm[1];
                }
                items.push({title: x.title || x.name || x.article_title || href, url: href});
            });
        } else if (dt.list) {
            dt.list.forEach(function(x) {
                var href = x.url || x.href || x.article_url;
                if (!href && x.id) href = String(x.id);
                else if (href) {
                    var mm = href.match(/\/archives\/(\d+)\//);
                    if (mm) href = mm[1];
                }
                items.push({title: x.title || x.name || x.article_title || href, url: href});
            });
        } else if (dt.html) {
            var ps2 = dt.html.split('<div class="video-item">');
            for (var j = 1; j < ps2.length; j++) {
                var b2 = ps2[j].substring(0, 2000);
                var h2 = (b2.match(/href="\/archives\/(\d+)\/"/) || [])[1];
                if (!h2) continue;
                items.push({title: (b2.match(/alt="([^"]+)"/) || [])[1] || h2, url: h2});
            }
        }
    } else {
        var ps3 = resp.split('<div class="video-item">');
        for (var k = 1; k < ps3.length; k++) {
            var b3 = ps3[k].substring(0, 2000);
            var h3 = (b3.match(/href="\/archives\/(\d+)\/"/) || [])[1];
            if (!h3) continue;
            items.push({title: (b3.match(/alt="([^"]+)"/) || [])[1] || h3, url: h3});
        }
    }
    var list = [];
    items.forEach(function(it) {
        list.push({vod_id: it.url, vod_name: it.title, vod_pic: '', vod_remarks: '搜索'});
    });
    return JSON.stringify({list: list, page: pg, pagecount: 1, total: list.length});
}

// ---------- 播放(直链透传) ----------
function playContent(flag, id, flags) {
    return {parse: 0, url: id, jx: 0};
}
