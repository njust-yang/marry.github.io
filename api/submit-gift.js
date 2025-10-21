// api/submit-gift.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: '只支持POST请求' });
    }

    try {
        const { name, phone, arrivalTime, gifts, timestamp } = req.body;

        console.log('收到提交数据:', { name, phone, arrivalTime, gifts });

        // 验证必要字段
        if (!name || !phone || !arrivalTime || !gifts) {
            return res.status(400).json({ 
                success: false, 
                message: '缺少必要字段：姓名、手机号、抵杭时间、礼物选择' 
            });
        }

        // 从环境变量获取GitHub Token
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        if (!GITHUB_TOKEN) {
            console.error('GITHUB_TOKEN环境变量未设置');
            return res.status(500).json({ 
                success: false, 
                message: '服务器配置错误' 
            });
        }

        // 创建GitHub Issue
        const issueData = {
            title: `🎁伴手礼选择 - ${name}`,
            body: `
## 用户信息
- **姓名**: ${name}
- **手机号**: ${phone}
- **抵杭时间**: ${arrivalTime}
- **选择礼物**: ${gifts}
- **提交时间**: ${timestamp}

## 详细信息
| 字段 | 内容 |
|------|------|
| 姓名 | ${name} |
| 手机号 | ${phone} |
| 抵杭时间 | ${arrivalTime} |
| 选择礼物 | ${gifts} |
| 提交时间 | ${timestamp} |
            `.trim(),
            labels: ["伴手礼", "婚礼"]
        };

        console.log('创建GitHub Issue:', issueData);

        const issueResponse = await fetch('https://api.github.com/repos/njust-yang/marry.github.io/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(issueData)
        });

        if (!issueResponse.ok) {
            const errorText = await issueResponse.text();
            console.error('GitHub API错误:', issueResponse.status, errorText);
            throw new Error(`GitHub API错误: ${issueResponse.status}`);
        }

        const issueResult = await issueResponse.json();
        console.log('GitHub Issue创建成功:', issueResult.html_url);

        res.status(200).json({ 
            success: true, 
            message: '提交成功！',
            issueUrl: issueResult.html_url
        });

    } catch (error) {
        console.error('API处理错误:', error);
        res.status(500).json({ 
            success: false, 
            message: `提交失败: ${error.message}` 
        });
    }
};
