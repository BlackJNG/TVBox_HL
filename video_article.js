// video_article_调试版(片单显字版)
// 说明：此版本取消了 MatLog 日志，直接将所有运行状态（抓到几篇/报错原因）直接显示在影视仓界面的片单和分类上。
// 使用方法：填入底部的 SITES 配置，部署到影视仓 drpy2 源中即可。

var DEBUG = true;
var SITES = [
    { name: '默认测试站', host: 'https://your-site-1.com' } 
    // ↑ 请在此处填写你的实际站点地址，格式如: { name: '电影站', host: 'https://www.xxx.com' }
];

/**
 * 核心调试输出函数，强制将信息输出到屏幕片单上
 */
function outputToScreen(title, msg, type) {
    let prefix = type === 'error' ? '❌' : (type === 'info' ? 'ℹ️' : '✅');
    let finalMsg = prefix + ' ' + title + '：' + msg;
    
    // 影视仓 drpy2 核心调试输出机制
    if (typeof print !== 'undefined') {
        print(finalMsg);
    } else if (typeof console !== 'undefined') {
        console.log(finalMsg);
    } else if (typeof log !== 'undefined') {
        log(finalMsg);
    }
    // 兼容影视仓部分版本的弹窗显示（防止日志面板缺失）
    try {
        if (typeof toast !== 'undefined') {
            toast(finalMsg);
        }
    } catch (e) {
        // 部分版本无 toast 方法，忽略
    }
}

// 全局请求函数封装，增加网络状态提示
function getHtml(url) {
    try {
        var html = request(url);
        if (!html || html.length < 100) {
            outputToScreen('网络请求', '获取到数据过短(长度:' + (html ? html.length : 0) + ')，请检查地址是否正确', 'error');
            return null;
        }
        return html;
    } catch (e) {
        outputToScreen('网络请求', '域名不通或拒绝访问。请检查 SITES 里的 host 地址。报错:' + e.message, 'error');
        return null;
    }
}

// 解析文章列表（首页、分类页、搜索页通用）
function parseList(html) {
    let result = [];
    if (!html) {
        outputToScreen('解析列表', '传入的 HTML 页面为空', 'error');
        return result;
    }
    
    // 匹配文章列表块
    let items = html.split('<div class="video-item">');
    outputToScreen('解析列表', '切出 video-item 块: ' + items.length + ' 个', 'info');
    
    if (items.length <= 1) {
        outputToScreen('解析列表', '未匹配到文章结构，站点页面结构可能已更新', 'error');
        return result;
    }
    
    for (let i = 1; i < items.length; i++) {
        let item = items[i];
        // 提取文章链接
        let urlMatch = item.match(/href="([^"]+\/archives\/\d+\/)"|href="(\/archives\/\d+\/)"/);
        if (!urlMatch) continue;
        let url = urlMatch[1] || urlMatch[2];
        
        // 提取文章标题
        let titleMatch = item.match(/alt="([^"]+)"/);
        let title = titleMatch ? titleMatch[1] : '未获取到标题';
        
        result.push({
            vod_id: url,
            vod_name: title,
            vod_pic: '', // 如果有封面图正则可在此处添加
            vod_remarks: '点击查看详情' 
        });
    }
    return result;
}

// 解析详情页中的视频
function parseArticleVideos(html) {
    let result = [];
    if (!html) {
        outputToScreen('解析详情', '详情页 HTML 为空', 'error');
        return result;
    }
    
    // 提取视频数据容器
    let videoMatches = [];
    let videoRegex = /data-video_title="([^"]+)"[\s\S]*?config='([^']+)'/g;
    let match;
    while ((match = videoRegex.exec(html)) !== null) {
        videoMatches.push({
            title: match[1],
            configStr: match[2]
        });
    }
    
    outputToScreen('解析详情', '发现视频播放器容器: ' + videoMatches.length + ' 个', 'info');
    
    if (videoMatches.length === 0) {
        outputToScreen('解析详情', '未找到 data-video_title 视频配置，文章可能无视频或结构已变', 'error');
        return result;
    }
    
    for (let i = 0; i < videoMatches.length; i++) {
        try {
            let configStr = videoMatches[i].configStr;
            let cfg = JSON.parse(configStr);
            let playUrl = cfg.video?.url || cfg.video?.source || '';
            if (!playUrl) {
                outputToScreen('解析视频', '视频标题: ' + videoMatches[i].title + ' | 未能提取到播放直链，跳过', 'error');
                continue;
            }
            result.push({
                name: videoMatches[i].title,
                url: playUrl
            });
        } catch (e) {
            outputToScreen('解析视频', '解析 JSON 配置报错: ' + e.message, 'error');
        }
    }
    return result;
}

// ================= TVBox 协议入口函数 =================

// 首页
function homeContent() {
    outputToScreen('进入入口', 'homeContent 开始执行...', 'info');
    
    if (!SITES || SITES.length === 0) {
        outputToScreen('致命错误', 'SITES 配置数组为空，请在脚本顶部填写站点地址！', 'error');
        return JSON.stringify({
            class: [{ type_id: 'error', type_name: '❌未填写SITES配置' }],
            list: []
        });
    }
    
    let classes = [];
    let lists = [];
    
    for (let i = 0; i < SITES.length; i++) {
        let site = SITES[i];
        let homeUrl = site.host + '/archives/'; // 文章站首页或分类页路径
        outputToScreen('抓取首页', '正在请求: ' + homeUrl, 'info');
        
        let html = getHtml(homeUrl);
        let articles = parseList(html);
        
        if (articles.length > 0) {
            outputToScreen('抓取结果', '站点[' + site.name + ']首页抓到: ' + articles.length + ' 篇', 'info');
            for (let j = 0; j < articles.length; j++) {
                articles[j].vod_remarks = site.name + ' | 抓' + articles.length + '篇';
            }
            lists = lists.concat(articles);
        } else {
            outputToScreen('抓取结果', '站点[' + site.name + ']首页抓空，可能是地址错误或结构变动', 'error');
            lists.push({
                vod_id: 'site_error_' + i,
                vod_name: '❌ ' + site.name + ' 抓取失败',
                vod_remarks: '地址错误/结构变动'
            });
        }
        
        // 注册分类（用于分类页点击）
        classes.push({
            type_id: 'site_' + i,
            type_name: '[' + site.name + '] 共' + articles.length + '篇'
        });
    }
    
    return JSON.stringify({
        class: classes,
        list: lists
    });
}

// 分类页
function categoryContent(tid, pg) {
    outputToScreen('进入分类', '请求分类 tid: ' + tid + ', 页码: ' + pg, 'info');
    
    if (tid.indexOf('site_') !== 0) {
        return JSON.stringify({ list: [] });
    }
    
    let siteIndex = parseInt(tid.replace('site_', ''));
    if (!SITES[siteIndex]) {
        outputToScreen('分类错误', '站点索引 ' + siteIndex + ' 不存在', 'error');
        return JSON.stringify({ list: [] });
    }
    
    let site = SITES[siteIndex];
    let categoryUrl = site.host + '/archives/page/' + pg + '/'; // 分类翻页路径，根据实际站点修改
    if (pg == 1) categoryUrl = site.host + '/archives/';
    
    outputToScreen('请求分类', '正在请求: ' + categoryUrl, 'info');
    let html = getHtml(categoryUrl);
    let articles = parseList(html);
    
    // 给列表项加上站点备注
    for (let j = 0; j < articles.length; j++) {
        articles[j].vod_remarks = site.name + ' | 第' + pg + '页';
    }
    
    outputToScreen('分类结果', '站点[' + site.name + ']第' + pg + '页抓到: ' + articles.length + ' 篇', 'info');
    
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: 10,
        limit: 20,
        total: articles.length,
        list: articles
    });
}

// 详情页
function detailContent(ids) {
    outputToScreen('进入详情', '请求详情 vod_id: ' + ids, 'info');
    
    let vodId = ids[0];
    let url = SITES[0].host + vodId; // 这里简化处理，实际需根据 vod_id 携带的站点索引获取 host
    outputToScreen('请求详情', '正在请求: ' + url, 'info');
    
    let html = getHtml(url);
    let videos = parseArticleVideos(html);
    
    if (videos.length === 0) {
        outputToScreen('详情结果', '详情页没有解析到任何可播放视频', 'error');
        return JSON.stringify({
            list: [{
                vod_id: vodId,
                vod_name: '❌ 该文章无视频',
                vod_remarks: '解析失败/无视频',
                vod_play_from: '提示',
                vod_play_url: '无视频$$$'
            }]
        });
    }
    
    // 拼接播放源字符串格式：名称$地址#名称$地址
    let playUrls = '';
    for (let i = 0; i < videos.length; i++) {
        playUrls += videos[i].name + '$' + videos[i].url;
        if (i < videos.length - 1) playUrls += '#';
    }
    
    outputToScreen('详情结果', '成功解析到 ' + videos.length + ' 个视频', 'info');
    
    return JSON.stringify({
        list: [{
            vod_id: vodId,
            vod_name: videos.length > 0 ? videos[0].name : '未知标题',
            vod_remarks: '✅ 共 ' + videos.length + ' 个视频',
            vod_play_from: '文章内视频',
            vod_play_url: playUrls
        }]
    });
}

// 搜索页
function searchContent(keyword, quick) {
    outputToScreen('进入搜索', '搜索关键字: ' + keyword, 'info');
    let allResults = [];
    
    for (let i = 0; i < SITES.length; i++) {
        let site = SITES[i];
        let searchUrl = site.host + '/?s=' + keyword;
        outputToScreen('搜索请求', '站点[' + site.name + '] 正在搜索: ' + searchUrl, 'info');
        
        let html = getHtml(searchUrl);
        let articles = parseList(html);
        
        if (articles.length > 0) {
            outputToScreen('搜索结果', '站点[' + site.name + '] 搜到: ' + articles.length + ' 篇', 'info');
            for (let j = 0; j < articles.length; j++) {
                articles[j].vod_remarks = '🔍 ' + site.name + ' | ' + articles[j].vod_remarks;
            }
            allResults = allResults.concat(articles);
        }
    }
    
    outputToScreen('搜索总结', '全站点共搜索到: ' + allResults.length + ' 篇', 'info');
    
    return JSON.stringify({ list: allResults });
}

// 播放器接口（直接返回直链）
function playerContent(vodId, playUrl) {
    outputToScreen('播放请求', '开始播放: ' + playUrl.substring(0, 50) + '...', 'info');
    return JSON.stringify({
        parse: 0, // 0 表示直接播放，不经过第三方解析
        playUrl: playUrl
    });
}
