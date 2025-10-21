// api/submit-gift.js - 部署到Vercel/Netlify等支持Serverless的平台
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: '只支持POST请求' });
    }

    try {
        const { name, phone, arrivalTime, gifts, timestamp } = req.body;

        // 验证必要字段
        if (!name || !phone || !arrivalTime || !gifts) {
            return res.status(400).json({ 
                success: false, 
                message: '缺少必要字段' 
            });
        }

        // 从环境变量获取GitHub Token
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        if (!GITHUB_TOKEN) {
            return res.status(500).json({ 
                success: false, 
                message: '服务器配置错误' 
            });
        }

        // 创建GitHub Issue
        const issueResponse = await fetch('https://api.github.com/repos/njust-yang/marry.github.io/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
            })
        });

        if (!issueResponse.ok) {
            const errorText = await issueResponse.text();
            throw new Error(`GitHub API错误: ${issueResponse.status} - ${errorText}`);
        }

        const issueData = await issueResponse.json();

        res.status(200).json({ 
            success: true, 
            message: '提交成功',
            issueUrl: issueData.html_url
        });

    } catch (error) {
        console.error('API处理错误:', error);
        res.status(500).json({ 
            success: false, 
            message: `提交失败: ${error.message}` 
        });
    }
}
