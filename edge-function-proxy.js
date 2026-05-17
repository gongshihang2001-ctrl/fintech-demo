/**
 * EdgeOne Edge Function — AI API 代理
 * 在 EdgeOne Pages 控制台 → 函数管理 → 创建函数 中粘贴此代码
 * 
 * 配置步骤：
 * 1. 打开 https://console.cloud.tencent.com/edgeone/pages/project/pages-1sgbbmdpeix1/index
 * 2. 进入"函数管理"或"Edge Functions"
 * 3. 创建新函数，名称如 "ai-proxy"
 * 4. 路由设置为: /api/chat/completions
 * 5. 粘贴下方代码
 * 6. 在环境变量中添加: DEEPSEEK_API_KEY = sk-ccd7985ca2364777af037fed80b07b53
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  const apiKey = typeof DEEPSEEK_API_KEY !== 'undefined' ? DEEPSEEK_API_KEY : '';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'API Key 未配置' } }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  let parsed;
  try {
    parsed = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid JSON body' } }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const { model, messages, stream, max_tokens, temperature, top_p, thinking, reasoning_effort } = parsed;

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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(proxyBody)
    });

    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); }
      catch { errorData = { error: { message: `API请求失败 (${response.status})` } }; }
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (stream) {
      const reader = response.body.getReader();
      const s = new ReadableStream({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            controller.enqueue(value);
          } catch (err) { controller.error(err); }
        },
        cancel() { reader.cancel(); }
      });
      return new Response(s, {
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          'connection': 'keep-alive',
        }
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: '代理服务器内部错误' } }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
