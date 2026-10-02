// ========================================================
// TC鸟 - TVBox 规则 v16（导航页实时发现线路 + 自动切换）
// 机制:
//   1. 抓 rule.nav 导航页 -> 正则提取 class="line-long" 的 href 域名（实时线路）
//   2. 导航页失效 -> 用 rule.hosts 兜底列表
//   3. 按序探测各域名，第一个返回正常内容的即为当前可用线路
// 改导航页/兜底域名: 修改下方 rule.nav / rule.hosts
// ========================================================

var rule = {
    title: 'TC鸟',
    host: 'https://tc.niao.com',
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

    // ===== 线路导航页（实时解析域名，含 line-long 链接）=====
    nav: 'https://address.zgn.com',
    // ===== 兜底域名（导航页打不开时按序尝试）=====
    hosts: ['https://tc.niao.com', 'https://tc2.niao.com', 'https://tc3.niao.com'],

    // 首页推荐：实时发现线路 -> 自动选可用
    推荐: 'js:var hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];try{var nav=request(rule.nav||"");if(nav&&typeof nav==="string"&&nav.length>50){var tags=nav.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length)hosts=hs.concat(hosts);}}catch(e){}var cur="";function getHtml(path){for(var i=0;i<hosts.length;i++){try{var h=request(hosts[i]+path);if(h&&typeof h==="string"&&h.length>100){cur=hosts[i];return h;}}catch(e){}}return "";}var html=getHtml("/");var list=[];var parts=html.split(\'<div class="video-item">\');for(var i=1;i<parts.length;i++){var block=parts[i].substring(0,2000);var hm=block.match(/href="(\\/archives\\/(\\d+)\\/)"/);if(!hm)continue;var tm=block.match(/alt="([^"]+)"/);var t=tm?tm[1]:hm[1];var img="";var im=block.match(/src="(https?:\\/\\/[^"]+)"/);if(im)img=im[1];else{var im2=block.match(/src="(\\/[^"]+)"/);if(im2&&cur)img=cur+im2[1];}list.push({vod_id:hm[2],vod_name:t,vod_pic:img,vod_remarks:"TC鸟"});}VODS=list;',

    // 分类/分页：实时发现线路 -> 自动选可用
    一级: 'js:var hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];try{var nav=request(rule.nav||"");if(nav&&typeof nav==="string"&&nav.length>50){var tags=nav.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length)hosts=hs.concat(hosts);}}catch(e){}var cur="";function getHtml(path){for(var i=0;i<hosts.length;i++){try{var h=request(hosts[i]+path);if(h&&typeof h==="string"&&h.length>100){cur=hosts[i];return h;}}catch(e){}}return "";}var path="/";var u=String(input||"");var mm=u.match(/https?:\\/\\/[^\\/]+(\\/.*)?/);if(mm&&mm[1]){path=mm[1];}else if(u.indexOf("/")===0){path=u;}var html=getHtml(path);var list=[];var parts=html.split(\'<div class="video-item">\');for(var i=1;i<parts.length;i++){var block=parts[i].substring(0,2000);var hm=block.match(/href="(\\/archives\\/(\\d+)\\/)"/);if(!hm)continue;var tm=block.match(/alt="([^"]+)"/);var t=tm?tm[1]:hm[1];var img="";var im=block.match(/src="(https?:\\/\\/[^"]+)"/);if(im)img=im[1];else{var im2=block.match(/src="(\\/[^"]+)"/);if(im2&&cur)img=cur+im2[1];}list.push({vod_id:hm[2],vod_name:t,vod_pic:img,vod_remarks:"TC鸟"});}VODS=list;',

    // 详情：实时发现线路 -> 自动选可用
    二级: 'js:var hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];try{var nav=request(rule.nav||"");if(nav&&typeof nav==="string"&&nav.length>50){var tags=nav.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length)hosts=hs.concat(hosts);}}catch(e){}var cur="";function getHtml(path){for(var i=0;i<hosts.length;i++){try{var h=request(hosts[i]+path);if(h&&typeof h==="string"&&h.length>100){cur=hosts[i];return h;}}catch(e){}}return "";}var path="/";var u=String(input||"");if(/^\\d+$/.test(u)){path="/archives/"+u+"/";}else{var mm=u.match(/https?:\\/\\/[^\\/]+(\\/.*)?/);if(mm&&mm[1]){path=mm[1];}else if(u.indexOf("/")===0){path=u;}}var html=getHtml(path);var videos=[];var titleRe=/data-video_title="([^"]+)"/g;var titles=[];var tm;while((tm=titleRe.exec(html))!==null){titles.push(tm[1]);}var configRe=/config=\'([^\']+)\'/g;var m;var ti=0;while((m=configRe.exec(html))!==null){try{var cfg=JSON.parse(m[1]);if(cfg.video&&cfg.video.url){var nm=(titles[ti]||("视频"+(videos.length+1)));videos.push(nm+"$"+cfg.video.url);}}catch(e){}ti++;}var nm2=html.match(/<h1[^>]*>([^<]+)<\\/h1>/);var vn=nm2?nm2[1].replace(/^\\s+|\\s+$/g,""):(titles[0]||"文章播放");var pu=videos.join("#");var pic="";var pm=html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);if(pm)pic=pm[1];else{var pm2=html.match(/<meta[^>]*property="og:image"[^>]*content="(\\/[^"]+)"/);if(pm2&&cur)pic=cur+pm2[1];}var tv=nm2?nm2[1].replace(/^\\s+|\\s+$/g,""):"";VOD={vod_id:u,vod_name:vn,vod_pic:pic,vod_remarks:pu?("共"+videos.length+"个视频"):"本文无视频",vod_play_from:pu?"TC鸟":"提示",vod_play_url:pu||"无视频$$$",type_name:"TC鸟",vod_year:"",vod_area:"",vod_director:"",vod_actor:"",vod_content:tv};',

    // 搜索：实时发现线路 -> 自动选可用
    搜索: 'js:var hosts=(typeof rule!=="undefined"&&rule.hosts)?rule.hosts.slice():[];try{var nav=request(rule.nav||"");if(nav&&typeof nav==="string"&&nav.length>50){var tags=nav.match(/<a[^>]*class=["\']line-long["\'][^>]*>/gi)||[];var hs=[];for(var t=0;t<tags.length;t++){var hm=tags[t].match(/href=["\'](https?:\\/\\/[^"\'\s>]+)["\']/i);if(!hm)continue;var dm=hm[1].match(/https?:\\/\\/([^\\/]+)/);var hh="https://"+(dm?dm[1]:hm[1]);if(hs.indexOf(hh)<0)hs.push(hh);}if(hs.length)hosts=hs.concat(hosts);}}catch(e){}var resp="";for(var i=0;i<hosts.length;i++){try{resp=post(hosts[i]+"/index/search_article",{body:"word="+encodeURIComponent(KEY)+"&page=1&oauth_type=h5"});if(resp&&resp.length>10)break;}catch(e){}}var data=null;try{data=JSON.parse(resp);}catch(e){}function pickHtml(hs){var r=[];var ps=hs.split(\'<div class="video-item">\');for(var i=1;i<ps.length;i++){var b=ps[i].substring(0,2000);var h=(b.match(/href="(\\/archives\\/(\\d+)\\/)"/)||[])[2];if(!h)continue;r.push({title:(b.match(/alt="([^"]+)"/)||[])[1]||h,url:h});}return r;}function pickArr(arr){var r=[];for(var i=0;i<arr.length;i++){var x=arr[i];var href=x.url||x.href||x.article_url;if(!href&&x.id){href=String(x.id);}else if(href){var mm=href.match(/\\/archives\\/(\\d+)\\//);if(mm){href=mm[1];}else if(href.indexOf("http")===0){href=href;}}r.push({title:x.title||x.name||x.article_title,url:href});}return r;}var d=[];var items=[];if(data){var dt=data.data||data.result||data;if(typeof dt==="string"){items=pickHtml(dt);}else if(Array.isArray(dt)){items=pickArr(dt);}else if(dt.list){items=pickArr(dt.list);}else if(dt.html){items=pickHtml(dt.html);}}else{items=pickHtml(resp);}for(var i=0;i<items.length;i++){d.push({title:items[i].title,img:"",content:"",desc:"",url:items[i].url});}setResult(d);'
}
