const https = require('https');

const url = 'https://tcnav.com';

https.get(url, (res) => {
    let html = '';
    res.on('data', (chunk) => {
        html += chunk;
    });
    res.on('end', () => {
        const lines = [];
        // 匹配 href="..." 中的链接，并提取包含“线路”或特定标识的文本
        // 根据 HTML 结构，我们寻找 class="line-long" 的 <a> 标签
        const regex = /<a[^>]+class="line-long"[^>]+href="([^"]+)"/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            lines.push(match[1]);
        }

        console.log("获取到的线路地址：");
        lines.forEach((line, index) => {
            console.log(`${index + 1}. ${line}`);
        });
    });
}).on('error', (err) => {
    console.error('请求出错:', err.message);
});
