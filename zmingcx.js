// ========================================================
// 知更鸟 zmingcx.com 专用规则 - 影视仓/猫影视 drpy2 兼容
// 站点: 知更鸟主题资源站 (WordPress, REST API 已禁用, 纯 HTML 解析)
// 说明: 首页=分类菜单+最新文章; 分类=文章列表; 详情=提取B站/MP4/iframe播放源
// 搜索: 该站开启搜索验证, searchContent 不可用, 返回空
// 适配: drpy2 (TVBox 系 type=3 站点)
// ========================================================

var HOST = 'https://zmingcx.com';
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// 首页分类菜单（type_id 为内部标识，CATS 映射到真实分类路径）
var CLASSES = [
    { type_id: 'home', type_name: '最新文章', filter: 0 },
    { type_id: 'cat_video', type_name: '影视音乐', filter: 0 },
    { type_id: 'cat_digital', type_name: '数码', filter: 0 },
    { type_id: 'cat_material', type_name: '素材', filter: 0 },
    { type_id: 'cat_wordpress', type_name: 'WordPress', filter: 0 },
    { type_id: 'cat_information', type_name: '资讯', filter: 0 },
    { type_id: 'cat_works', type_name: '作品', filter: 0 },
    { type_id: 'cat_literacy', type_name: '科普', filter: 0 }
];

var CATS = {
    'cat_video': 'navigation/video',
    'cat_digital': 'digital',
    'cat_material': 'material',
    'cat_wordpress': 'navigation/wordpress',
    'cat_information': 'information',
    'cat_works': 'works',
    'cat_literacy': 'literacy'
};

// ---------------- 工具：带 UA 抓取 ----------------
function get(url) {
    try {
        var html = request(url, { headers: { 'User-Agent': UA } });
        if (html && typeof html === 'string' && html.length > 100) {
            return html;
        }
    } catch (e) {}
    try {
        var html2 = request(url);
        if (html2 && typeof html2 === 'string' && html2.length > 100) {
            return html2;
        }
    } catch (e2) {}
    return '';
}

// ---------------- 工具：解析列表页（首页/分类页/分页通用） ----------------
function parseList(html) {
    var list = [];
    var items = html.split('<article');
    for (var i = 1; i < items.length; i++) {
        var item = items[i];
        var urlM = item.match(/href="(https:\/\/zmingcx\.com\/[^"]+\.html)"/);
        if (!urlM) {
            continue;
        }
        var titleM = item.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/);
        var title = titleM ? titleM[1].replace(/^\s+|\s+$/g, '') : '未知标题';
        var pic = '';
        var picM = item.match(/background-image:\s*url\(([^)]+)\)/);
        if (picM) {
            pic = picM[1];
        } else {
            var ds = item.match(/data-src="(https?:\/\/[^"]+)"/);
            if (ds) {
                pic = ds[1];
            }
        }
        list.push({
            vod_id: urlM[1],
            vod_name: title,
            vod_pic: pic,
            vod_remarks: '知更鸟'
        });
    }
    return list;
}

// ---------------- 1. 首页：分类菜单 + 最新文章 ----------------
function homeContent(filter) {
    var list = parseList(get(HOST + '/'));
    return JSON.stringify({ class: CLASSES, list: list });
}

// ---------------- 2. 分类页：文章列表 ----------------
function categoryContent(tid, pg, filter, extend) {
    var page = parseInt(pg) || 1;
    if (page < 1) page = 1;

    var url = '';
    if (tid === 'home') {
        url = page > 1 ? HOST + '/page/' + page + '/' : HOST + '/';
    } else if (CATS[tid]) {
        url = HOST + '/category/' + CATS[tid] + '/';
        if (page > 1) {
            url = HOST + '/category/' + CATS[tid] + '/page/' + page + '/';
        }
    } else {
        return JSON.stringify({ list: [] });
    }

    var list = parseList(get(url));
    return JSON.stringify({ list: list, page: page, pagecount: 10, total: list.length });
}

// ---------------- 3. 详情页：提取播放源 ----------------
function detailContent(ids) {
    if (!ids || ids.length === 0) {
        return JSON.stringify({ list: [] });
    }
    var id = ids[0];
    if (id.indexOf('http') !== 0) {
        id = HOST + id;
    }

    var html = get(id);
    if (!html) {
        return JSON.stringify({ list: [] });
    }

    // 文章标题（详情页展示用）
    var titleM = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    var artTitle = titleM ? titleM[1].replace(/^\s+|\s+$/g, '') : '文章播放';

    var videos = [];
    var m;

    // B站 iframe: //player.bilibili.com/player.html?bvid=BVxxx&p=1
    var reB = /<iframe[^>]*src="(\/\/player\.bilibili\.com\/player\.html\?[^"]+)"/gi;
    while ((m = reB.exec(html)) !== null) {
        var bv = m[1].match(/bvid=([A-Za-z0-9]+)/);
        if (bv) {
            videos.push({ name: 'B站' + (videos.length + 1), url: 'https://www.bilibili.com/video/' + bv[1] });
        } else {
            videos.push({ name: 'B站' + (videos.length + 1), url: 'https:' + m[1] });
        }
    }

    // 直链 mp4
    var reM = /(?:src|data-src)="(https?:\/\/[^"]*\.mp4[^"]*)"/gi;
    while ((m = reM.exec(html)) !== null) {
        videos.push({ name: '视频' + (videos.length + 1), url: m[1] });
    }

    // 其他 iframe（去重，跳过已收录的 B站）
    var reI = /<iframe[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi;
    while ((m = reI.exec(html)) !== null) {
        var src = m[1];
        var dup = false;
        for (var i = 0; i < videos.length; i++) {
            if (videos[i].url === src) {
                dup = true;
                break;
            }
        }
        if (!dup) {
            videos.push({ name: '嵌入' + (videos.length + 1), url: src });
        }
    }

    if (videos.length === 0) {
        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: artTitle,
                vod_remarks: '本文无内嵌播放源',
                vod_play_from: '提示',
                vod_play_url: '无视频$$$'
            }]
        });
    }

    var playUrls = '';
    for (var j = 0; j < videos.length; j++) {
        playUrls += videos[j].name + '$' + videos[j].url;
        if (j < videos.length - 1) {
            playUrls += '#';
        }
    }

    return JSON.stringify({
        list: [{
            vod_id: id,
            vod_name: artTitle,
            vod_remarks: '共 ' + videos.length + ' 个播放源',
            vod_play_from: '知更鸟',
            vod_play_url: playUrls
        }]
    });
}

// ---------------- 4. 搜索：站点开启搜索验证，不可用 ----------------
function searchContent(keyword, quickSearch) {
    return JSON.stringify({ list: [] });
}
