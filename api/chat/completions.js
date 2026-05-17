// Vercel Serverless Function — AI API 代理
// 路由: /api/chat/completions

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-ccd7985ca2364777af037fed80b07b53';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: { message: 'Invalid JSON' } });
  }

  const { model, messages, stream, max_tokens, temperature, top_p, thinking, reasoning_effort } = body;

  const proxyBody = {
    model: model || 'deepseek-chat',
    messages,
    stream,
    max_tokens,
    ...(thinking ? { thinking, reasoning_effort } : { temperature, top_p })
  };

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(proxyBody)
    });

    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); }
      catch { errorData = { error: { message: `API请求失败 (${response.status})` } }; }
      return res.status(response.status).json(errorData);
    }

    if (stream) {
      res.setHeader('content-type', 'text/event-stream; charset=utf-8');
      res.setHeader('cache-control', 'no-cache');
      res.setHeader('connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          const text = decoder.decode(value, { stream: true });
          res.write(text);
        }
      } catch (streamErr) {
        res.end();
      }
    } else {
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: { message: '代理服务器内部错误: ' + error.message } });
  }
};
