// ========================================================
// 知更鸟 zmingcx.com 专用规则 v4 - drpy2 配置型（var rule）
// 依据 drpy2 运行时真实加载逻辑编写：
//   init() 用 eval(js.replace('var rule','rule')) 加载规则
//   解析字段支持 js: 前缀内嵌代码，eval 后把结果赋给 VODS(列表)/VOD(详情)
// 站点: WordPress(知更鸟主题), REST API 禁用, 纯 HTML 解析
// 搜索: 站点开启搜索验证, 不可用
// ========================================================

// ---- 列表页解析代码（内嵌到 js: 字段中，供首页/分类复用） ----
var PARSELIST = [
    'function parseList(html){',
    'var list=[];',
    'var items=html.split("<article");',
    'for(var i=1;i<items.length;i++){',
    'var it=items[i];',
    'var um=it.match(/href="(https:\\/\\/zmingcx\\.com\\/[^"]+\\.html)"/);',
    'if(!um){continue;}',
    'var tm=it.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>\\s*<a[^>]*>([^<]+)<\\/a>/);',
    'var t=tm?tm[1].replace(/^\\s+|\\s+$/g,""):"未知标题";',
    'var pic="";',
    'var pm=it.match(/background-image:\\s*url\\(([^)]+)\\)/);',
    'if(pm){pic=pm[1];}else{var ds=it.match(/data-src="(https?:\\/\\/[^"]+)"/);if(ds){pic=ds[1];}}',
    'list.push({vod_id:um[1],vod_name:t,vod_pic:pic,vod_remarks:"知更鸟"});',
    '}',
    'return list;',
    '}'
].join('\n');

// ---- 详情页播放解析代码（内嵌到二级 js: 字段中） ----
var PARSEDETAIL = [
    'function parseDetail(html){',
    'var videos=[];var m;',
    'var reB=/<iframe[^>]*src="(\\/\\/player\\.bilibili\\.com\\/player\\.html\\?[^"]+)"/gi;',
    'while((m=reB.exec(html))!==null){',
    'var bv=m[1].match(/bvid=([A-Za-z0-9]+)/);',
    'if(bv){videos.push({n:"B站"+(videos.length+1),u:"https://www.bilibili.com/video/"+bv[1]});}',
    '}',
    'var reM=/(?:src|data-src)="(https?:\\/\\/[^"]*\\.mp4[^"]*)"/gi;',
    'while((m=reM.exec(html))!==null){videos.push({n:"视频"+(videos.length+1),u:m[1]});}',
    'var reI=/<iframe[^>]*src="(https?:\\/\\/[^"]+)"[^>]*>/gi;',
    'while((m=reI.exec(html))!==null){',
    'var dup=false;',
    'for(var i=0;i<videos.length;i++){if(videos[i].u===m[1]){dup=true;break;}}',
    'if(!dup){videos.push({n:"嵌入"+(videos.length+1),u:m[1]});}',
    '}',
    'return videos;',
    '}'
].join('\n');

// ---- drpy2 配置型规则 ----
var rule = {
    title: '知更鸟',
    host: 'https://zmingcx.com',
    homeUrl: 'https://zmingcx.com/',

    // 分类菜单
    class_name: '影视音乐|数码|素材|WordPress|资讯|作品|科普',
    class_url: 'navigation/video|digital|material|navigation/wordpress|information|works|literacy',

    // 分类页 URL 模板：fyclass=分类路径, (fypage>1?...)=分页表达式
    url: '/category/fyclass/(fypage>1?"page/"+fypage+"/":"")',

    // 请求头
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    },

    // 首页列表：抓首页 HTML 解析
    推荐: 'js:' + PARSELIST + ';var list=parseList(request(input));VODS=list;',

    // 分类列表：input 已是拼好的分类页 URL
    一级: 'js:' + PARSELIST + ';var list=parseList(request(input));VODS=list;',

    // 详情页：提取 B站/MP4/iframe 播放源
    二级: 'js:' + PARSEDETAIL + ';var html=request(input);var videos=parseDetail(html);' +
        'var titleM=html.match(/<h1[^>]*>([^<]+)<\\/h1>/);' +
        'var vodName=titleM?titleM[1].replace(/^\\s+|\\s+$/g,""):"文章播放";' +
        'var playUrls="";' +
        'for(var k=0;k<videos.length;k++){playUrls+=videos[k].n+"$"+videos[k].u;if(k<videos.length-1){playUrls+="#";}}' +
        'VOD={vod_id:input,vod_name:vodName,vod_pic:"",vod_remarks:"共"+videos.length+"个播放源",vod_play_from:"知更鸟",vod_play_url:playUrls};',

    // 搜索：站点开启搜索验证，返回空
    搜索: 'js:VODS=[];',

    timeout: 30
};
