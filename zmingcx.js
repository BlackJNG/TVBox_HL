// ========================================================
// 知更鸟 zmingcx.com 专用规则 v7 - drpy2 纯语法版
// 依据: 用户设备上确认可用的「网易公版」规则格式
// 关键: 推荐/一级/二级 全部使用 drpy2 标准解析语法(非 js: 内嵌)
// 站点: WordPress(知更鸟), REST API 禁用, 纯 HTML 解析
// 搜索: 站点开启搜索验证, 不可用
// ========================================================

var rule = {
    title: '知更鸟',
    host: 'https://zmingcx.com',
    homeUrl: 'https://zmingcx.com/',

    // 分类页 URL：fyclass=分类路径；分页用表达式 (fypage>1?...)
    url: '/category/fyclass/(fypage>1?"page/"+fypage+"/":"")',

    // 分类菜单（class_url 与 fyclass 对应）
    class_name: '影视音乐&数码&素材&WordPress&资讯&作品&科普',
    class_url: 'navigation/video&digital&material&navigation/wordpress&information&works&literacy',

    // 请求头
    headers: {
        'User-Agent': 'MOBILE_UA'
    },

    timeout: 30000,
    limit: 20,

    // 播放时不做转换，直接放（B站链接由影视仓内置解析）
    play_parse: true,

    // 首页列表（CSS 解析语法：容器;标题;图片;备注;链接）
    推荐: 'body&&.post-item-list;h2&&a&&Text;a.thumbs-back&&style;;h2&&a&&href',

    // 分类列表（首页与分类页卡片结构相同，可复用）
    一级: 'body&&.post-item-list;h2&&a&&Text;a.thumbs-back&&style;;h2&&a&&href',

    // 详情：标题 + 播放源（iframe 里的 B站等）
    二级: {
        title: 'h1&&Text',
        img: '',
        desc: '',
        content: '',
        tabs: 'iframe',
        lists: 'iframe&&src'
    },

    // 搜索：站点开启搜索验证，返回空
    搜索: '*'
};
