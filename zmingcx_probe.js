// ========================================================
// 知更鸟探针规则 - 决定性诊断实验
// 骨架完全复刻「网易公版」（用户设备确认可用）
// 唯一区别：不抓取任何网页，返回静态数据
// 用途：定位「知更鸟文章站」空白到底是
//       A. drpy2 规则加载问题（探针也空）
//       B. HTML 抓取/解析问题（探针正常，知更鸟空）
// ========================================================

var rule = {
    title: '知更鸟探针',
    host: 'https://zmingcx.com',
    homeUrl: '/',
    url: '/',
    class_name: '测试分类A&测试分类B&测试分类C',
    class_url: 'a&b&c',
    searchUrl: '/',
    searchable: 0,
    quickSearch: 0,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 5000,
    limit: 6,
    play_parse: true,
    lazy: 'js:input={jx:0,url:input,parse:0}',
    推荐: 'js:VODS=[{vod_id:"1",vod_name:"探针首页1",vod_pic:"",vod_remarks:"静态"},{vod_id:"2",vod_name:"探针首页2",vod_pic:"",vod_remarks:"静态"}]',
    一级: 'js:VODS=[{vod_id:"1",vod_name:"探针分类1",vod_pic:"",vod_remarks:"静态"},{vod_id:"2",vod_name:"探针分类2",vod_pic:"",vod_remarks:"静态"}]',
    二级: 'js:VOD={vod_id:input,vod_name:"探针详情",vod_play_from:"探针",vod_play_url:"测试播放$$$https://example.com/a.mp4"}',
    搜索: 'js:VODS=[]'
}
