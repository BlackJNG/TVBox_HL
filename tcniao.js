// ========================================================
// TC鸟 - TVBox 规则 v25（V13 结构 + 规则直接抓导航页一次 + rule._nav 缓存 + hosts 兜底）
// 机制:
//   1. 抓导航页 https://tcnav.com -> 提取 class="line-long" 最新线路（3条）
//   2. 抓取时按顺序 request: 第1条挂了自动用第2条, 依次
//   3. 判定严格(页面含 video-item/config=), 错误页不会误判
//   4. 切割/列表 = V13/脚本原样; 收藏 vod_id 纯数字
// 导航页打不开时兜底 rule.hosts
// ========================================================

var rule = {
    title: 'TC鸟',
    host: 'https://tcniao.com',
    homeUrl: '/',
    url: '/page/fypage/',
    class_name: '最新视频',
    class_url: 'home',
    searchUrl: '/index/search_article?word=**&page=fypage',
    searchable: 1,
    quickSearch: 1,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 30000,
    limit: 20,
    play_parse: true,
    lazy: 'js:input={jx:0,url:input,parse:0}',

    // ===== 导航页（实时取最新线路，顺序使用）=====
    nav: 'https://hlwf19.com',
    // ===== 兜底域名（导航页打不开时用）=====
    hosts: ['https://tcniao.com'],

    // 首页推荐：导航页取线路 -> 顺序使用
    推荐: 'js:var hosts=[];if(typeof rule!=="undefined"&&rule._nav&&rule._nav.length){hosts=rule._nav;}else{try{var nv=request(rule.nav||"");if(nv&&typeof nv==="string"&&nv.length>50){var tags=nv.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length){hosts=hs;if(typeof rule!=="undefined")rule._nav=hs;}}}catch(e){}}if(!hosts.length)hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];function getHtml(path,mark){for(var i=0;i<hosts.length;i++){try{var h=request(hosts[i]+path);if(h&&typeof h==="string"&&h.length>200&&h.indexOf(mark)>0){return h;}}catch(e){}}return "";}var html=getHtml("/","video-item");var list=[];var parts=html.split(\'<div class="video-item">\');for(var i=1;i<parts.length;i++){var block=parts[i].substring(0,2000);var hm=block.match(/href="(\\/archives\\/(\\d+)\\/)"/);if(!hm)continue;var tm=block.match(/alt="([^"]+)"/);var t=tm?tm[1]:hm[1];var img="";var im=block.match(/src="(https?:\\/\\/[^"]+)"/);if(im)img=im[1];else{var im2=block.match(/src="(\\/[^"]+)"/);if(im2)img=HOST+im2[1];}list.push({vod_id:hm[2],vod_name:t,vod_pic:img,vod_remarks:"TC鸟"});}VODS=list;',

    // 分类/分页：导航页取线路 -> 顺序使用
    一级: 'js:var hosts=[];if(typeof rule!=="undefined"&&rule._nav&&rule._nav.length){hosts=rule._nav;}else{try{var nv=request(rule.nav||"");if(nv&&typeof nv==="string"&&nv.length>50){var tags=nv.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length){hosts=hs;if(typeof rule!=="undefined")rule._nav=hs;}}}catch(e){}}if(!hosts.length)hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];function getHtml(path,mark){for(var i=0;i<hosts.length;i++){try{var h=request(hosts[i]+path);if(h&&typeof h==="string"&&h.length>200&&h.indexOf(mark)>0){return h;}}catch(e){}}return "";}var path="/";var u=String(input||"");var mm=u.match(/https?:\\/\\/[^\\/]+(\\/.*)?/);if(mm&&mm[1]){path=mm[1];}else if(u.indexOf("/")===0){path=u;}var html=getHtml(path,"video-item");var list=[];var parts=html.split(\'<div class="video-item">\');for(var i=1;i<parts.length;i++){var block=parts[i].substring(0,2000);var hm=block.match(/href="(\\/archives\\/(\\d+)\\/)"/);if(!hm)continue;var tm=block.match(/alt="([^"]+)"/);var t=tm?tm[1]:hm[1];var img="";var im=block.match(/src="(https?:\\/\\/[^"]+)"/);if(im)img=im[1];else{var im2=block.match(/src="(\\/[^"]+)"/);if(im2)img=HOST+im2[1];}list.push({vod_id:hm[2],vod_name:t,vod_pic:img,vod_remarks:"TC鸟"});}VODS=list;',

    // 详情：导航页取线路 -> 顺序使用 -> V13 切割
    二级: 'js:var hosts=[];if(typeof rule!=="undefined"&&rule._nav&&rule._nav.length){hosts=rule._nav;}else{try{var nv=request(rule.nav||"");if(nv&&typeof nv==="string"&&nv.length>50){var tags=nv.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length){hosts=hs;if(typeof rule!=="undefined")rule._nav=hs;}}}catch(e){}}if(!hosts.length)hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];var pth="";var u=String(input||"");if(/^\\d+$/.test(u)){pth="/archives/"+u+"/";}else{var mm=u.match(/https?:\\/\\/[^\\/]+(\\/.*)?/);if(mm&&mm[1]){pth=mm[1];}else if(u.indexOf("/")===0){pth=u;}}var html="";var cur="";for(var i=0;i<hosts.length;i++){try{var h=request(hosts[i]+pth);if(h&&typeof h==="string"&&h.length>200&&(h.indexOf("config=")>0||h.indexOf("data-video_title")>0)){html=h;cur=hosts[i];break;}}catch(e){}}var videos=[];var titleRe=/data-video_title="([^"]+)"/g;var titles=[];var tm;while((tm=titleRe.exec(html))!==null){titles.push(tm[1]);}var configRe=/config=\'([^\']+)\'/g;var m;var ti=0;while((m=configRe.exec(html))!==null){try{var cfg=JSON.parse(m[1]);var vu="";if(cfg.video){vu=cfg.video.url||"";if(!vu&&cfg.video.urls&&cfg.video.urls.length)vu=cfg.video.urls[0].url;}if(vu){var nm=(titles[ti]||("视频"+(videos.length+1)));videos.push(nm+"$"+vu);}}catch(e){}ti++;}var nm2=html.match(/<h1[^>]*>([^<]+)<\\/h1>/);var vn=nm2?nm2[1].replace(/^\\s+|\\s+$/g,""):(titles[0]||"文章播放");var pu=videos.join("#");var pic="";var pm=html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);if(pm)pic=pm[1];else{var pm2=html.match(/<meta[^>]*property="og:image"[^>]*content="(\\/[^"]+)"/);if(pm2&&cur)pic=cur+pm2[1];}VOD={vod_id:u,vod_name:vn,vod_pic:pic,vod_remarks:pu?("共"+videos.length+"个视频"):"本文无视频",vod_play_from:pu?"TC鸟":"提示",vod_play_url:pu||"无视频$$$",type_name:"TC鸟",vod_year:"",vod_area:"",vod_director:"",vod_actor:"",vod_content:(cur||HOST)+pth};',

    // 搜索：导航页取线路 -> 顺序使用
    搜索: 'js:var hosts=[];if(typeof rule!=="undefined"&&rule._nav&&rule._nav.length){hosts=rule._nav;}else{try{var nv=request(rule.nav||"");if(nv&&typeof nv==="string"&&nv.length>50){var tags=nv.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length){hosts=hs;if(typeof rule!=="undefined")rule._nav=hs;}}}catch(e){}}if(!hosts.length)hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];var d=[];var pg=(typeof MY_PAGE!=="undefined"&&MY_PAGE)?MY_PAGE:1;var resp="";for(var i=0;i<hosts.length;i++){try{resp=post(hosts[i]+"/index/search_article",{body:"word="+encodeURIComponent(KEY)+"&page="+pg+"&oauth_type=h5"});if(resp&&resp.length>10)break;}catch(e){}}var data=null;try{data=JSON.parse(resp);}catch(e){}function pickHtml(hs){var r=[];var ps=hs.split(\'<div class="video-item">\');for(var i=1;i<ps.length;i++){var b=ps[i].substring(0,2000);var h=(b.match(/href="(\\/archives\\/(\\d+)\\/)"/)||[])[2];if(!h)continue;r.push({title:(b.match(/alt="([^"]+)"/)||[])[1]||h,url:h});}return r;}function pickArr(arr){var r=[];for(var i=0;i<arr.length;i++){var x=arr[i];var href=x.url||x.href||x.article_url;if(!href&&x.id){href=String(x.id);}else if(href){var mm=href.match(/\\/archives\\/(\\d+)\\//);if(mm){href=mm[1];}else if(href.indexOf("http")===0){href=href;}}r.push({title:x.title||x.name||x.article_title,url:href});}return r;}var items=[];if(data){var dt=data.data||data.result||data;if(typeof dt==="string"){items=pickHtml(dt);}else if(Array.isArray(dt)){items=pickArr(dt);}else if(dt.list){items=pickArr(dt.list);}else if(dt.html){items=pickHtml(dt.html);}}else{items=pickHtml(resp);}for(var i=0;i<items.length;i++){d.push({title:items[i].title,img:"",content:"",desc:"",url:items[i].url});}setResult(d);'
}
