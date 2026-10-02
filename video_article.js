// ============================================================
// 影视仓 / TVBox 首页文章源  兼容版 (无 emoji, 无可选链, 纯 var)
// 内核通用: 影视仓(派大星)=TVBoxOSC 魔改, 写法一致
// 用法: type:3 的源, api 指向 drpy2.min.js, ext 指向本文件地址
// 自检: 只要脚本被成功加载, 首页一定先显示"首页文章"分类
// ============================================================

// 改这里: 你的真实站点根地址, 结尾不要带斜杠
var HOST = 'https://jryck.vrlvlgvm.cc/';

// ---------- 工具: 抓 HTML ----------
function getHtml(url) {
    try {
        var h = request(url);
        if (!h) return '';
        return h;
    } catch (e) {
        return '';
    }
}

// ---------- 文章列表解析(按油猴规则: video-item + archives) ----------
function parseList(html) {
    var arr = [];
    if (!html || html.length < 50) return arr;
    var blocks = html.split('video-item');
    if (blocks.length <= 1) return arr;
    for (var i = 1; i < blocks.length; i++) {
        var blk = blocks[i];
        var um = blk.match(/href=["']([^"']*\/archives\/[^"']*)["']/);
        if (!um) continue;
        var link = um[1];
        var tm = blk.match(/alt=["']([^"']*)["']/);
        if (!tm) tm = blk.match(/title=["']([^"']*)["']/);
        var title = tm ? tm[1] : '未取到标题';
        arr.push({
            vod_id: link,
            vod_name: title,
            vod_pic: '',
            vod_remarks: 'OK 已匹配'
        });
    }
    return arr;
}

// ---------- 首页: 固定一个分类, 保证一定显示 ----------
function homeContent(filter) {
    var classes = [];
    classes.push({ type_id: 'home', type_name: '首页文章' });
    return JSON.stringify({ class: classes, list: [] });
}

// ---------- 分类页: 抓 /archives/ 文章列表 ----------
function categoryContent(tid, pg, filter, extend) {
    if (tid !== 'home') return JSON.stringify({ list: [] });
    try {
        var url = HOST + '/archives/';
        if (pg > 1) url = HOST + '/archives/page/' + pg + '/';
        var html = getHtml(url);

        if (!html) {
            return JSON.stringify({ list: [{
                vod_id: 'e1', vod_name: '【ERR】页面为空', vod_remarks: '域名不通/ext未配置或Host错误'
            }] });
        }
        if (html.length < 200) {
            return JSON.stringify({ list: [{
                vod_id: 'e2', vod_name: '【ERR】页面过短(' + html.length + ')', vod_remarks: '可能被拦截或地址错'
            }] });
        }

        var list = parseList(html);
        if (list.length === 0) {
            return JSON.stringify({ list: [{
                vod_id: 'e3', vod_name: '【ERR】结构没匹配', vod_remarks: '未切到 video-item, 站点结构已变'
            }] });
        }
        return JSON.stringify({ list: list, page: parseInt(pg), total: list.length, pagecount: 20 });
    } catch (e) {
        return JSON.stringify({ list: [{
            vod_id: 'e9', vod_name: '【ERR】运行报错', vod_remarks: '' + e.message
        }] });
    }
}

// ---------- 详情: 提取 data-video_title + config ----------
function detailContent(ids) {
    try {
        var id = ids[0];
        var url = id;
        if (id.indexOf('http') !== 0) url = HOST + id;
        var html = getHtml(url);
        if (!html) {
            return JSON.stringify({ list: [{ vod_id: id, vod_name: '【ERR】详情为空', vod_remarks: '域名不通', vod_play_from: 'tip', vod_play_url: 'no$no' }] });
        }
        var re = /data-video_title=["']([^"']*)["'][\s\S]*?config=['"]([^'"]*)['"]/g;
        var m, vids = [];
        while ((m = re.exec(html)) !== null) {
            var name = m[1];
            var cfgStr = m[2];
            try {
                var cfg = eval('(' + cfgStr + ')');
                var playUrl = '';
                if (cfg && cfg.video) {
                    if (cfg.video.url) playUrl = cfg.video.url;
                    else if (cfg.video.source) playUrl = cfg.video.source;
                }
                if (playUrl) vids.push({ name: name, url: playUrl });
            } catch (ee) { }
        }
        if (vids.length === 0) {
            return JSON.stringify({ list: [{ vod_id: id, vod_name: '【ERR】无视频', vod_remarks: '未匹配 video_title/config', vod_play_from: 'tip', vod_play_url: 'no$no' }] });
        }
        var play = '';
        for (var i = 0; i < vids.length; i++) {
            play += vids[i].name + '$' + vids[i].url;
            if (i < vids.length - 1) play += '#';
        }
        return JSON.stringify({ list: [{
            vod_id: id, vod_name: vids[0].name, vod_remarks: 'OK 共' + vids.length + '个视频',
            vod_play_from: '文章内视频', vod_play_url: play
        }] });
    } catch (e) {
        return JSON.stringify({ list: [{ vod_id: ids[0], vod_name: '【ERR】详情报错', vod_remarks: '' + e.message, vod_play_from: 'tip', vod_play_url: 'no$no' }] });
    }
}

// ---------- 播放直链 ----------
function playerContent(flag, id, vipFlags) {
    return JSON.stringify({ parse: 0, playUrl: id });
}

// ---------- 搜索 ----------
function searchContent(key, quick) {
    try {
        var url = HOST + '/?s=' + encodeURIComponent(key);
        var html = getHtml(url);
        var list = parseList(html);
        return JSON.stringify({ list: list });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}
