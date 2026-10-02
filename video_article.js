// ========================================================
// 【影视仓 drpy2 适配版】文章爬虫 (固定首页分类 + 界面调试显字)
// 说明：直接按油猴脚本正则提取，抓取状态直接显示在片单上。
// ========================================================

// 【核心配置】请修改下面的 host 为你的真实站点地址（结尾不要带斜杠 /）
var SITES = [
    { name: '测试站点', host: 'https://jryck.vrlvlgvm.cc' } 
];

// ========================================================
// 1. 首页入口：固定分类
// ========================================================
function homeContent(filter) {
    var classes = [];
    classes.push({ type_id: 'home', type_name: '📄 首页文章 (加载中...)' });
    return JSON.stringify({ class: classes, list: [] });
}

// ========================================================
// 2. 分类页：请求首页文章列表 + 界面显字
// ========================================================
function categoryContent(tid, pg, filter, extend) {
    if (tid !== 'home') return JSON.stringify({ list: [] });
    
    var site = SITES[0];
    if (!site) {
        return JSON.stringify({ list: [{ vod_id: 'err', vod_name: '❌ 错误', vod_remarks: '未配置站点' }] });
    }

    // 请求地址
    var url = site.host + '/archives/';
    if (pg > 1) url = site.host + '/archives/page/' + pg + '/';

    try {
        var html = request(url);
        
        // 显字：提示页面获取状态
        if (!html || html.length < 100) {
            return JSON.stringify({ list: [{ vod_id: 'err', vod_name: '❌ 页面加载失败', vod_remarks: '域名不通/页面长度过短(' + (html?html.length:'null') + ')' }] });
        }
        
        // 显字：提示正在按油猴规则截取
        var items = html.split('<div class="video-item">');
        if (items.length <= 1) {
            return JSON.stringify({ list: [{ vod_id: 'err', vod_name: '❌ 正则未匹配', vod_remarks: '未切出 video-item 块' }] });
        }

        var result = [];
        for (var i = 1; i < items.length; i++) {
            var item = items[i];
            var urlMatch = item.match(/href="([^"]+\/archives\/\d+\/)"/);
            if (!urlMatch) continue;
            
            var url = urlMatch[1];
            var titleMatch = item.match(/alt="([^"]+)"/);
            var title = titleMatch ? titleMatch[1] : '未知标题';
            
            result.push({
                vod_id: url,
                vod_name: title,
                vod_pic: '',
                vod_remarks: '✅ 匹配成功' // 显字：列表项状态
            });
        }

        // 显字：列表解析结果
        if (result.length === 0) {
            return JSON.stringify({ list: [{ vod_id: 'err', vod_name: '❌ 解析为空', vod_remarks: '未获取到有效链接' }] });
        }

        return JSON.stringify({ list: result, page: parseInt(pg), total: result.length, pagecount: 10 });

    } catch (e) {
        // 显字：捕获任何运行报错
        return JSON.stringify({ list: [{ vod_id: 'err', vod_name: '❌ 脚本崩溃', vod_remarks: e.message }] });
    }
}

// ========================================================
// 3. 详情页：提取视频 + 界面显字
// ========================================================
function detailContent(ids) {
    try {
        var vodId = ids[0];
        var url = SITES[0].host + vodId;
        var html = request(url);
        
        var result = [];
        var videoRegex = /data-video_title="([^"]+)"[\s\S]*?config='([^']+)'/g;
        var match;
        
        while ((match = videoRegex.exec(html)) !== null) {
            var title = match[1];
            var configStr = match[2];
            try {
                var cfg = eval('(' + configStr + ')');
                var playUrl = cfg.video?.url || cfg.video?.source || '';
                if (playUrl) {
                    result.push({ name: title, url: playUrl });
                }
            } catch (e) {}
        }

        // 显字：视频解析结果
        if (result.length === 0) {
            return JSON.stringify({ list: [{ vod_id: vodId, vod_name: '❌ 未解析到视频', vod_remarks: 'data-video_title/config 正则不匹配', vod_play_from: '提示', vod_play_url: '无视频$$$' }] });
        }

        var playUrls = '';
        for (var i = 0; i < result.length; i++) {
            playUrls += result[i].name + '$' + result[i].url;
            if (i < result.length - 1) playUrls += '#';
        }

        return JSON.stringify({ list: [{ vod_id: vodId, vod_name: result[0].name, vod_remarks: '✅ 共解析 ' + result.length + ' 个视频', vod_play_from: '文章内视频', vod_play_url: playUrls }] });

    } catch (e) {
        return JSON.stringify({ list: [{ vod_id: ids[0], vod_name: '❌ 详情报错', vod_remarks: e.message }] });
    }
}

// ========================================================
// 4. 播放直链 + 搜索功能
// ========================================================
function playerContent(flag, id, vipFlags) {
    return JSON.stringify({ parse: 0, playUrl: id });
}

function searchContent(key, quick) {
    try {
        var url = SITES[0].host + '/?s=' + key;
        var html = request(url);
        var items = html.split('<div class="video-item">');
        var result = [];
        for (var i = 1; i < items.length; i++) {
            var urlMatch = items[i].match(/href="([^"]+\/archives\/\d+\/)"/);
            if (!urlMatch) continue;
            var titleMatch = items[i].match(/alt="([^"]+)"/);
            result.push({
                vod_id: urlMatch[1],
                vod_name: titleMatch ? titleMatch[1] : '未知',
                vod_remarks: '🔍 搜索结果'
            });
        }
        return JSON.stringify({ list: result });
    } catch (e) {
        return JSON.stringify({ list: [{ vod_id: 'err', vod_name: '❌ 搜索报错', vod_remarks: e.message }] });
    }
}
