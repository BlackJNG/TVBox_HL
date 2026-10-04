var HOST = 'https://heiliao.com';
// 备用线路，如果主站被封，可以手动修改 HOST 或在此处添加逻辑
var BACKUP_HOSTS = [
    'https://f4mea.nmgwptcd.cc', // 导航站，可能需要额外处理
    'https://heiliao.cc'  // 假设的备用域名
];

/**
 * 通用请求函数
 */
function req(url, headers) {
    var h = headers || {};
    h['User-Agent'] = h['User-Agent'] || 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    return request(url, {headers: h});
}

/**
 * 首页内容 - 适配 heiliao.com 的实际 HTML 结构
 */
function homeContent() {
    var html = req(HOST);
    var list = [];
    
    // 尝试匹配 article 或 post 块
    // 观察 HTML 源码，虽然没有 .video-item，但有 <article> 或类似的容器
    // 这里使用更稳健的正则提取所有文章链接和图片
    
    // 1. 提取所有文章链接 ID
    var idRegex = /href="\/archives\/(\d+)\//g;
    var ids = [];
    var match;
    while ((match = idRegex.exec(html)) !== null) {
        ids.push(match[1]);
    }
    
    // 2. 提取图片 (假设图片在 article 内，或者通过 class 查找)
    // 由于 HTML 复杂，我们尝试匹配 src="..." 且在 article 上下文中的图片
    // 更简单的方法：匹配 <img src="(.*?)" ...> 并在后续过滤
    var imgRegex = /src="(https?:\/\/[^"]+\.jpg|https?:\/\/[^"]+\.png)"/gi;
    var imgs = [];
    while ((match = imgRegex.exec(html)) !== null) {
        imgs.push(match[1]);
    }
    
    // 3. 提取标题
    var titleRegex = /alt="(.*?)"/g; // 很多图片有 alt
    // 或者 h2/a 标签内的文本
    var textRegex = /<h2[^>]*>(.*?)<\/h2>/gi; 
    var titles = [];
    while ((match = textRegex.exec(html)) !== null) {
        titles.push(match[1].trim());
    }
    
    // 如果上面的方法取不到足够的数据，回退到更宽泛的提取
    if (titles.length === 0) {
        // 尝试从 a 标签中提取文本作为标题
        var aTitleRegex = /<a[^>]+title="(.*?)"/gi;
        while ((match = aTitleRegex.exec(html)) !== null) {
            titles.push(match[1]);
        }
    }

    // 合并数据
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var pic = imgs[i] ? imgs[i] : '';
        var title = titles[i] ? titles[i] : '黑料视频 ' + id;
        
        // 确保图片是绝对路径
        if (pic && !pic.startsWith('http')) {
            pic = HOST + pic;
        }
        
        list.push({
            vod_id: id,
            vod_name: title,
            vod_pic: pic,
            type_name: '黑料',
            vod_remarks: '更新'
        });
    }
    
    return JSON.stringify({
        list: list,
        page: 1,
        pagecount: 1, // 首页只有一页，分页需另行处理
        total: list.length
    });
}

/**
 * 分类内容 (这里简化为首页逻辑，实际可加分类筛选)
 */
function classContent(tid, pg) {
    var url = HOST + (pg > 1 ? '/page/' + pg + '/' : '/');
    var html = req(url);
    // 复用 homeContent 的解析逻辑，只需传入 html
    return parseListFromHtml(html);
}

/**
 * 辅助函数：从 HTML 解析列表
 */
function parseListFromHtml(html) {
    var ids = [];
    var idRegex = /href="\/archives\/(\d+)\//g;
    var match;
    while ((match = idRegex.exec(html)) !== null) {
        ids.push(match[1]);
    }
    
    var imgs = [];
    var imgRegex = /src="(https?:\/\/[^"]+\.(?:jpg|png|webp))"/gi;
    while ((match = imgRegex.exec(html)) !== null) {
        imgs.push(match[1]);
    }
    
    var titles = [];
    var titleRegex = /<h2[^>]*>(.*?)<\/h2>/gi;
    while ((match = titleRegex.exec(html)) !== null) {
        titles.push(match[1].trim());
    }
    
    var list = [];
    for (var i = 0; i < ids.length; i++) {
        var pic = imgs[i] || '';
        if (pic && !pic.startsWith('http')) pic = HOST + pic;
        var title = titles[i] || ('视频' + ids[i]);
        
        list.push({
            vod_id: ids[i],
            vod_name: title,
            vod_pic: pic,
            type_name: '黑料',
            vod_remarks: ''
        });
    }
    
    return JSON.stringify({
        list: list,
        page: 1,
        pagecount: 1,
        total: list.length
    });
}

/**
 * 详情内容
 */
function detailContent(ids) {
    var id = ids[0];
    var url = HOST + '/archives/' + id + '/';
    var html = req(url);
    
    // 1. 提取 config JSON
    var configMatch = html.match(/config='([^']+)'/);
    var plays = [];
    
    if (configMatch) {
        try {
            var cfgStr = configMatch[1];
            // 处理可能的转义字符，如 \/
            cfgStr = cfgStr.replace(/\\\//g, '/');
            var cfg = JSON.parse(cfgStr);
            
            var videoUrl = '';
            var videoPic = '';
            
            if (cfg.video) {
                videoUrl = cfg.video.url || '';
                videoPic = cfg.video.pic || '';
                
                // 如果有备用线路
                if (!videoUrl && cfg.video.urls && cfg.video.urls.length > 0) {
                    videoUrl = cfg.video.urls[0].url;
                }
            }
            
            if (videoUrl) {
                // 标题优先用 data-video_title，其次 h1
                var titleMatch = html.match(/data-video_title="(.*?)"/);
                var title = titleMatch ? titleMatch[1] : '未知视频';
                
                plays.push(title + '$' + videoUrl);
            }
        } catch (e) {
            console.log('JSON 解析失败: ' + e.message);
        }
    } else {
        // 如果没有 config，尝试从 HTML 中找其他视频源 (可选)
        // 这里先留空
    }
    
    // 封面 fallback
    var pic = '';
    var ogImg = html.match(/property="og:image"[^>]*content="(.*?)"/);
    if (ogImg) pic = ogImg[1];
    else {
        var h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (h1Match) pic = ''; // 没有图片则留空
    }
    
    if (pic && !pic.startsWith('http')) pic = HOST + pic;
    
    return JSON.stringify({
        list: [{
            vod_id: id,
            vod_name: '详情',
            vod_pic: pic,
            type_name: '黑料',
            vod_year: '',
            vod_area: '',
            vod_director: '',
            vod_actor: '',
            vod_content: 'ID: ' + id,
            vod_play_from: '内部线路',
            vod_play_url: plays.length > 0 ? plays.join('#') : '无视频$$$'
        }]
    });
}

/**
 * 搜索
 */
function searchContent(key, quick) {
    var pg = MY_PAGE || 1;
    var url = HOST + '/index/search_article';
    var body = 'word=' + encodeURIComponent(key) + '&page=' + pg + '&oauth_type=h5';
    var resp = req(url, {
        'Content-Type': 'application/x-www-form-urlencoded'
    }, body); // 注意：request 函数的 body 参数位置可能因环境而异，通常是第三个参数或对象属性
    
    // 如果是 drpy2，post 函数可能有不同签名，这里假设使用标准 request 模拟 POST
    // 实际上 drpy2 中 post(url, {body: body}) 更常见
    // 让我们重新写一个标准的 post 调用
    var html = post(url, {body: body});
    
    return parseListFromHtml(html);
}

// 导出规则 (drpy2 格式)
var rule = {
    title: 'TC鸟-黑料',
    host: HOST,
    url: '/fyclassfyfilter.html',
    searchUrl: '/index/search_article?word=**&page=fypage&oauth_type=h5',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    header: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    },
    class_parse: function(){
        return JSON.stringify({class: [{type_id: 'home', type_name: '全部'}]});
    },
    推荐: homeContent,
    一级: classContent,
    二级: detailContent,
    搜索: searchContent
};
