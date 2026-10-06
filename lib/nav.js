// ========================================================
// TC鸟 导航页自动更新脚本 v2
// 用法: node nav.js
//   1. 抓 https://tcnav.com (导航页, 列最新线路)
//   2. 提取 class="line-long" 的线路地址 (去重/规范化)
//   3. 自动写回同目录 nav.json (数据文件, 规则引用它)
// 然后推送 nav.json 到 GitHub, 影视仓重新加载配置即生效
// 说明: 可用环境变量 NAV_URL 覆盖导航页地址
// ========================================================
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const url = process.env.NAV_URL || 'https://tcnav.com';
const outFile = path.join(__dirname, 'nav.json');

(url.indexOf('http://') === 0 ? http : https).get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' }
}, (res) => {
    let html = '';
    res.on('data', (chunk) => { html += chunk; });
    res.on('end', () => {
        const hosts = [];
        // 匹配 class="line-long" 的 <a> 标签中的 href
        const regex = /<a[^>]+class="line-long"[^>]+href="([^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            let h = match[1].trim();
            if (!/^https?:\/\//i.test(h)) h = 'https://' + h;
            const dm = h.match(/^https?:\/\/[^\/]+/i);
            if (!dm) continue;
            const hh = dm[0].replace(/\/+$/, '');
            if (hosts.indexOf(hh) < 0) hosts.push(hh);
        }

        if (!hosts.length) {
            console.error('❌ 导航页未提取到线路（可能被反爬拦截或页面结构变了）');
            process.exit(1);
        }

        // 自动写回 nav.json
        fs.writeFileSync(outFile, JSON.stringify(hosts, null, 2) + '\n', 'utf8');

        console.log('✅ 已自动更新 ' + outFile + ' (' + hosts.length + ' 条线路)');
        hosts.forEach((line, index) => { console.log(`${index + 1}. ${line}`); });
        console.log('下一步: 把 nav.json 推送到 GitHub, 影视仓重新加载配置即可');
    });
}).on('error', (err) => {
    console.error('❌ 请求出错:', err.message);
    process.exit(1);
});
