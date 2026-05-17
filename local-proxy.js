/**
 * 本地开发代理服务器
 * 模拟 Vercel Serverless Function，在本地开发时保护 API Key
 *
 * 使用方式：
 * 1. 创建 .env 文件，写入 DEEPSEEK_API_KEY=sk-xxx
 * 2. 终端1: node local-proxy.js   (启动代理，端口3001)
 * 3. 终端2: npm start             (启动前端，端口3000，自动代理到3001)
 *
 * 部署到 Vercel 时不需要这个文件，Vercel 会自动使用 api/ 目录下的 Serverless Function
 */

const http = require('http');
const https = require('https');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const PORT = 3001;

// 读取 .env 文件
const fs = require('fs');
const path = require('path');
let apiKey = process.env.DEEPSEEK_API_KEY;
const envPath = path.join(__dirname, '.env');
if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DEEPSEEK_API_KEY\s*=\s*(.+)/);
  if (match) apiKey = match[1].trim();
}

if (!apiKey) {
  console.error('❌ 未找到 DEEPSEEK_API_KEY，请在 .env 文件中设置');
  console.error('   创建 demo/.env 文件，内容：DEEPSEEK_API_KEY=sk-xxx');
  process.exit(1);
}

console.log(`✅ API Key 已加载 (${apiKey.slice(0, 8)}...)`);

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // 收集请求体
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const { model, messages, stream, max_tokens, temperature, top_p, thinking, reasoning_effort } = parsed;
    const proxyBody = {
      model: model || 'deepseek-chat',
      messages,
      stream,
      max_tokens,
      ...(thinking ? { thinking, reasoning_effort } : { temperature, top_p })
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const proxyReq = https.request(DEEPSEEK_API_URL, options, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        let errBody = '';
        proxyRes.on('data', c => { errBody += c; });
        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(errBody);
        });
        return;
      }

      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        proxyRes.pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        proxyRes.pipe(res);
      }
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: '代理请求失败' } }));
    });

    proxyReq.write(JSON.stringify(proxyBody));
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 本地代理已启动: http://localhost:${PORT}`);
  console.log(`   前端 npm start 会自动代理 /api → localhost:${PORT}`);
  console.log(`   按 Ctrl+C 停止`);
});
