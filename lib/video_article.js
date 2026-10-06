// ========================================================
// Video Article.js
// 影视仓 drpy2 兼容版 - 首页文章源
// 规则：按油猴脚本结构提取文章列表与视频播放地址
// ========================================================

var HOST = 'https://baidu.com';

// ========================================================
// 1. 首页：固定返回分类，不联网
// ========================================================
function homeContent(filter) {
    var classes = [];
    classes.push({
        type_id: "home",
        type_name: "首页文章"
    });
    return JSON.stringify({
        class: classes,
        list: []
    });
}

// ========================================================
// 2. 分类页：请求文章列表
// ========================================================
function categoryContent(tid, pg, filter, extend) {
    if (tid !== "home") {
        return JSON.stringify({ list: [] });
    }

    if (!HOST || HOST.indexOf("http") !== 0) {
        return JSON.stringify({
            list: [{
                vod_id: "err",
                vod_name: "未配置站点",
                vod_pic: "",
                vod_remarks: "请在脚本顶部填写 HOST"
            }]
        });
    }

    var url = HOST + "/archives/";
    if (pg && parseInt(pg) > 1) {
        url = HOST + "/archives/page/" + pg + "/";
    }

    try {
        var html = request(url);

        if (!html || typeof html !== "string" || html.length < 100) {
            return JSON.stringify({
                list: [{
                    vod_id: "err",
                    vod_name: "页面加载失败",
                    vod_pic: "",
                    vod_remarks: "域名不通或页面返回为空"
                }]
            });
        }

        var items = html.split('<div class="video-item">');

        if (items.length <= 1) {
            return JSON.stringify({
                list: [{
                    vod_id: "err",
                    vod_name: "未匹配到文章结构",
                    vod_pic: "",
                    vod_remarks: "页面中没有 video-item 块"
                }]
            });
        }

        var result = [];

        for (var i = 1; i < items.length; i++) {
            var item = items[i];

            var urlMatch = item.match(/href="([^"]+\/archives\/\d+\/)"/);
            if (!urlMatch) {
                continue;
            }

            var articleUrl = urlMatch[1];

            var titleMatch = item.match(/alt="([^"]+)"/);
            var title = titleMatch ? titleMatch[1] : "未知标题";

            var picMatch = item.match(/src="([^"]+)"/);
            var pic = picMatch ? picMatch[1] : "";

            result.push({
                vod_id: articleUrl,
                vod_name: title,
                vod_pic: pic,
                vod_remarks: "已匹配"
            });
        }

        if (result.length === 0) {
            return JSON.stringify({
                list: [{
                    vod_id: "err",
                    vod_name: "解析结果为空",
                    vod_pic: "",
                    vod_remarks: "页面中有 video-item，但未提取到链接"
                }]
            });
        }

        return JSON.stringify({
            list: result,
            page: parseInt(pg) || 1,
            pagecount: 10,
            total: result.length
        });

    } catch (e) {
        return JSON.stringify({
            list: [{
                vod_id: "err",
                vod_name: "脚本运行错误",
                vod_pic: "",
                vod_remarks: e.message
            }]
        });
    }
}

// ========================================================
// 3. 详情页：提取视频
// ========================================================
function detailContent(ids) {
    if (!ids || ids.length === 0) {
        return JSON.stringify({ list: [] });
    }

    try {
        var vodId = ids[0];

        var url = "";
        if (vodId.indexOf("http") === 0) {
            url = vodId;
        } else {
            url = HOST + vodId;
        }

        var html = request(url);

        if (!html || typeof html !== "string") {
            return JSON.stringify({
                list: [{
                    vod_id: vodId,
                    vod_name: "详情页加载失败",
                    vod_remarks: "页面返回为空",
                    vod_play_from: "提示",
                    vod_play_url: "无视频$$$"
                }]
            });
        }

        var videos = [];
        var videoRegex = /data-video_title="([^"]+)"[\s\S]*?config='([^']+)'/g;
        var match;

        while ((match = videoRegex.exec(html)) !== null) {
            var title = match[1];
            var configStr = match[2];

            try {
                var cfg = eval("(" + configStr + ")");
                var playUrl = "";

                if (cfg && cfg.video) {
                    playUrl = cfg.video.url || cfg.video.source || "";
                }

                if (playUrl) {
                    videos.push({
                        name: title,
                        url: playUrl
                    });
                }
            } catch (e) {
                continue;
            }
        }

        if (videos.length === 0) {
            return JSON.stringify({
                list: [{
                    vod_id: vodId,
                    vod_name: "未解析到视频",
                    vod_remarks: "未匹配到 data-video_title 或 config",
                    vod_play_from: "提示",
                    vod_play_url: "无视频$$$"
                }]
            });
        }

        var playUrls = "";
        for (var i = 0; i < videos.length; i++) {
            playUrls += videos[i].name + "$" + videos[i].url;
            if (i < videos.length - 1) {
                playUrls += "#";
            }
        }

        return JSON.stringify({
            list: [{
                vod_id: vodId,
                vod_name: videos[0].name,
                vod_remarks: "共 " + videos.length + " 个视频",
                vod_play_from: "文章视频",
                vod_play_url: playUrls
            }]
        });

    } catch (e) {
        return JSON.stringify({
            list: [{
                vod_id: ids[0],
                vod_name: "详情解析错误",
                vod_remarks: e.message
            }]
        });
    }
}

// ========================================================
//
