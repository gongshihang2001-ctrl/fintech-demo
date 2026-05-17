/**
 * Cloudflare Worker — AI API 代理
 * 
 * 使用方式：
 * 1. 打开 https://dash.cloudflare.com → Workers 和 Pages → 创建 Worker
 * 2. 复制粘贴本文件全部代码
 * 3. 在 Worker 设置 → 环境变量中，添加：
 *    - DEEPSEEK_API_KEY = sk-ccd7985ca2364777af037fed80b07b53
 * 4. 部署，获取 Worker URL（例如 https://deepseek-proxy.workers.dev）
 * 
 * 在 Demo 中使用：
 * - 点击右上角设置 ⚙
 * - API 地址填入 Worker URL（例如 https://deepseek-proxy.workers.dev）
 * - API Key 留空（Key 已在 Worker 服务端配置）
 * - 模型选择 deepseek-chat
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// CORS 头（所有响应都要设置，包括错误响应）
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 1. CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // 2. 仅支持 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  }

  // 3. 获取 API Key（从环境变量）
  const apiKey = typeof DEEPSEEK_API_KEY !== 'undefined' ? DEEPSEEK_API_KEY : globalThis.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: '服务器未配置 API Key，请在 Worker 设置中添加环境变量 DEEPSEEK_API_KEY' } }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      }
    );
  }

  // 4. 解析请求体
  let parsed;
  try {
    parsed = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid JSON body' } }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  }

  const { model, messages, stream, max_tokens, temperature, top_p, thinking, reasoning_effort } = parsed;

  const proxyBody = {
    model: model || 'deepseek-chat',
    messages,
    stream,
    max_tokens,
    ...(thinking ? { thinking, reasoning_effort } : { temperature, top_p }),
  };

  // 5. 转发请求到 DeepSeek API
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(proxyBody),
    });

    // 处理错误响应
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: `API 请求失败 (${response.status})` } };
      }
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    // 流式响应
    if (stream) {
      const reader = response.body.getReader();
      const s = new ReadableStream({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
          } catch (err) {
            controller.error(err);
          }
        },
        cancel() {
          reader.cancel();
        },
      });
      return new Response(s, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          'connection': 'keep-alive',
        },
      });
    }

    // 非流式响应
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: '代理服务器内部错误: ' + error.message } }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  }
}
