// ========================================================
// 知更鸟 zmingcx.com - 影视仓新版 JS 源（ES Module 原生格式）
// 接口: init / home / homeVod / category / detail / play / search
// 机制: 与 feigeys 的 get.js 同款，由影视仓内置 JS 引擎直接执行
//       —— 不需要下载 drpy2 运行时，只需加载本规则文件
// 站点: WordPress(知更鸟), REST API 禁用, 纯 HTML 解析
// 搜索: 站点开启搜索验证, 不可用
// ========================================================

const HOST = 'https://zmingcx.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// 首页分类菜单
const CLASSES = [
    { type_id: 'home', type_name: '最新文章' },
    { type_id: 'cat_video', type_name: '影视音乐' },
    { type_id: 'cat_digital', type_name: '数码' },
    { type_id: 'cat_material', type_name: '素材' },
    { type_id: 'cat_wordpress', type_name: 'WordPress' },
    { type_id: 'cat_information', type_name: '资讯' },
    { type_id: 'cat_works', type_name: '作品' },
    { type_id: 'cat_literacy', type_name: '科普' }
];

// 分类 id → 站点真实分类路径
const CATS = {
    'cat_video': 'navigation/video',
    'cat_digital': 'digital',
    'cat_material': 'material',
    'cat_wordpress': 'navigation/wordpress',
    'cat_information': 'information',
    'cat_works': 'works',
    'cat_literacy': 'literacy'
};

// ---------------- 工具：抓取 ----------------
async function fetchHtml(url) {
    try {
        const html = await request(url);
        if (html && typeof html === 'string' && html.length > 100) {
            return html;
        }
    } catch (e) {}
    try {
        const html2 = await request(url, { headers: { 'User-Agent': UA } });
        if (html2 && typeof html2 === 'string' && html2.length > 100) {
            return html2;
        }
    } catch (e2) {}
    return '';
}

// ---------------- 工具：列表解析 ----------------
function parseList(html) {
    const list = [];
    const items = html.split('<article');
    for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const um = item.match(/href="(https:\/\/zmingcx\.com\/[^"]+\.html)"/);
        if (!um) continue;
        const tm = item.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/);
        const t = tm ? tm[1].replace(/^\s+|\s+$/g, '') : '未知标题';
        let pic = '';
        const pm = item.match(/background-image:\s*url\(([^)]+)\)/);
        if (pm) {
            pic = pm[1];
        } else {
            const ds = item.match(/data-src="(https?:\/\/[^"]+)"/);
            if (ds) pic = ds[1];
        }
        list.push({ vod_id: um[1], vod_name: t, vod_pic: pic, vod_remarks: '知更鸟' });
    }
    return list;
}

// ---------------- 工具：详情播放解析 ----------------
function parseDetail(html) {
    const videos = [];
    let m;
    // B站 iframe
    const reB = /<iframe[^>]*src="(\/\/player\.bilibili\.com\/player\.html\?[^"]+)"/gi;
    while ((m = reB.exec(html)) !== null) {
        const bv = m[1].match(/bvid=([A-Za-z0-9]+)/);
        if (bv) {
            videos.push({ n: 'B站' + (videos.length + 1), u: 'https://www.bilibili.com/video/' + bv[1] });
        } else {
            videos.push({ n: 'B站' + (videos.length + 1), u: 'https:' + m[1] });
        }
    }
    // 直链 mp4
    const reM = /(?:src|data-src)="(https?:\/\/[^"]*\.mp4[^"]*)"/gi;
    while ((m = reM.exec(html)) !== null) {
        videos.push({ n: '视频' + (videos.length + 1), u: m[1] });
    }
    // 其他 iframe（去重）
    const reI = /<iframe[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi;
    while ((m = reI.exec(html)) !== null) {
        let dup = false;
        for (let i = 0; i < videos.length; i++) {
            if (videos[i].u === m[1]) { dup = true; break; }
        }
        if (!dup) videos.push({ n: '嵌入' + (videos.length + 1), u: m[1] });
    }
    return videos;
}

// ========================================================
// 影视仓 JS 源接口
// ========================================================

async function init(cfg) {}

// 首页：分类菜单
async function home(filter) {
    return JSON.stringify({ class: CLASSES });
}

// 首页：推荐列表
async function homeVod() {
    const html = await fetchHtml(HOST + '/');
    const list = parseList(html);
    return JSON.stringify({ list });
}

// 分类列表
async function category(tid, pg, filter, extend) {
    const page = parseInt(pg) || 1;
    let url = '';
    if (tid === 'home') {
        url = page > 1 ? HOST + '/page/' + page + '/' : HOST + '/';
    } else if (CATS[tid]) {
        url = HOST + '/category/' + CATS[tid] + '/';
        if (page > 1) {
            url = HOST + '/category/' + CATS[tid] + '/page/' + page + '/';
        }
    }
    if (!url) {
        return JSON.stringify({ list: [] });
    }
    const html = await fetchHtml(url);
    const list = parseList(html);
    return JSON.stringify({ page: page, pagecount: 10, list: list });
}

// 详情：提取 B站/MP4/iframe 播放源
async function detail(id) {
    let url = id;
    if (url.indexOf('http') !== 0) {
        url = HOST + id;
    }
    const html = await fetchHtml(url);
    if (!html) {
        return JSON.stringify({ list: [] });
    }
    const titleM = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const artTitle = titleM ? titleM[1].replace(/^\s+|\s+$/g, '') : '文章播放';
    const videos = parseDetail(html);
    if (videos.length === 0) {
        return JSON.stringify({
            list: [{
                vod_id: url,
                vod_name: artTitle,
                vod_remarks: '本文无内嵌播放源',
                vod_play_from: '提示',
                vod_play_url: '无视频$$$'
            }]
        });
    }
    const playUrls = videos.map(v => v.n + '$' + v.u).join('#');
    return JSON.stringify({
        list: [{
            vod_id: url,
            vod_name: artTitle,
            vod_remarks: '共 ' + videos.length + ' 个播放源',
            vod_play_from: '知更鸟',
            vod_play_url: playUrls
        }]
    });
}

// 播放
async function play(flag, id, flags) {
    return JSON.stringify({ parse: 0, playUrl: id, header: '' });
}

// 搜索：站点开启搜索验证，不可用
async function search(wd, quick, pg) {
    return JSON.stringify({ list: [] });
}

// 导出接口（影视仓 JS 引擎通过此函数获取接口对象）
export function __jsEvalReturn() {
    return { init, home, homeVod, category, detail, play, search };
}
