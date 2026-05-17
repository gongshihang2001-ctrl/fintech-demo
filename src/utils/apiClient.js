/**
 * apiClient.js — AI API调用封装
 * 支持OpenAI兼容格式的API调用（流式 + 非流式）
 */

/**
 * 流式调用AI API
 * @param {Object} config - API配置 { baseUrl, apiKey, model }
 * @param {string} systemPrompt - 系统提示词
 * @param {Array} messages - 对话历史 [{ role, content }]
 * @param {Function} onThinking - 思考过程回调 (thinkingText) => void
 * @param {Function} onContent - 内容回调 (contentText) => void
 * @param {Function} onDone - 完成回调 () => void
 * @param {Function} onError - 错误回调 (error) => void
 * @param {Object} options - 额外选项 { enableThinking: boolean }
 * @returns {Function} abort函数，可用于取消请求
 */
export function callAIStream(config, systemPrompt, messages, { onThinking, onContent, onDone, onError }, options = {}) {
  const { baseUrl, apiKey, model } = config;
  const { enableThinking = true } = options;

  if (!baseUrl) {
    onError?.(new Error('请先配置API地址（点击右上角设置）'));
    return () => {};
  }

  // 构建请求消息
  const requestMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  // 确保URL以正确路径结尾
  let url = baseUrl.replace(/\/+$/, '');
  if (!url.endsWith('/chat/completions')) {
    url += '/chat/completions';
  }

  const controller = new AbortController();

  // 判断是否走代理（/api 开头 = 服务端代理，Key在服务端；否则直连，需前端传Key）
  const isProxy = url.startsWith('/api');
  const headers = { 'Content-Type': 'application/json' };
  if (!isProxy && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  (async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: requestMessages,
          stream: true,
          max_tokens: 4096,
          // 思考模式下 temperature/top_p 不生效，但非思考模式需要
          ...(enableThinking
            ? {
                thinking: { type: 'enabled' },
                reasoning_effort: 'high'
              }
            : {
                temperature: 0.7,
                top_p: 0.95
              }
          )
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // 代理404 = 代理未部署，提示用户配置直连
        if (isProxy && response.status === 404) {
          throw new Error('API代理不可用，请点击右上角设置，将API地址改为 https://api.deepseek.com 并填入您的API Key');
        }
        throw new Error(
          errorData.error?.message ||
          `API请求失败 (${response.status}: ${response.statusText})`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按行解析 SSE
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === ':') continue; // 跳过空行和注释
          if (trimmed === 'data: [DONE]') {
            onDone?.();
            return;
          }
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const chunk = JSON.parse(jsonStr);
              const delta = chunk.choices?.[0]?.delta;
              if (!delta) continue;

              // DeepSeek 的思考过程字段
              if (delta.reasoning_content) {
                onThinking?.(delta.reasoning_content);
              }
              // 正常内容
              if (delta.content) {
                onContent?.(delta.content);
              }
            } catch (e) {
              // JSON解析失败，跳过这一行
              console.warn('SSE parse error:', e.message, jsonStr);
            }
          }
        }
      }

      // 流正常结束
      onDone?.();
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        onError?.(new Error('网络连接失败，请检查API地址是否正确'));
      } else {
        onError?.(error);
      }
    }
  })();

  // 返回取消函数
  return () => controller.abort();
}

/**
 * 非流式调用AI API（保留作为备用）
 */
export async function callAI(config, systemPrompt, messages) {
  const { baseUrl, apiKey, model } = config;

  if (!baseUrl) {
    throw new Error('请先配置API地址（点击右上角设置）');
  }

  const requestMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  let url = baseUrl.replace(/\/+$/, '');
  if (!url.endsWith('/chat/completions')) {
    url += '/chat/completions';
  }

  // 判断是否走代理
  const isProxy = url.startsWith('/api');
  const headers = { 'Content-Type': 'application/json' };
  if (!isProxy && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: requestMessages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (isProxy && response.status === 404) {
        throw new Error('API代理不可用，请点击右上角设置，将API地址改为 https://api.deepseek.com 并填入您的API Key');
      }
      throw new Error(
        errorData.error?.message ||
        `API请求失败 (${response.status}: ${response.statusText})`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error('API返回格式异常');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查API地址是否正确');
    }
    throw error;
  }
}
