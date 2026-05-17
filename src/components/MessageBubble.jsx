import React, { useState } from 'react';
import '../styles/messages.css';

/**
 * MessageBubble — 单条消息气泡
 * 支持：普通文本、流式渐进显示、思考过程折叠展示
 */
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  // 推荐方案轮次默认展开思考过程
  const [thinkingExpanded, setThinkingExpanded] = useState(
    message.showThinkingByDefault || false
  );

  // Markdown渲染（加粗、换行、列表）
  const renderContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 处理加粗
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // 处理 "三张保单" 用引号包裹的加粗
      processed = processed.replace(/[""](.*?)[""]/g, '<strong>"$1"</strong>');
      // 处理列表项
      if (processed.startsWith('· ') || processed.startsWith('- ')) {
        processed = '<span class="list-dot">·</span>' + processed.substring(2);
        return <div key={i} className="msg-list-item" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      // 处理编号列表
      const numMatch = processed.match(/^(\d+[️⃣]?\s)/);
      if (numMatch) {
        return <div key={i} className="msg-list-item msg-numbered" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      // 空行
      if (!processed.trim()) {
        return <div key={i} className="msg-line-break" />;
      }
      return <div key={i} className="msg-line" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  // 思考过程区域
  const renderThinking = () => {
    if (!message.thinking) return null;

    const isStreaming = message.isStreaming && !message.content;
    const isRecommendation = message.showThinkingByDefault;

    return (
      <div className={`thinking-block ${thinkingExpanded ? 'expanded' : 'collapsed'} ${isRecommendation ? 'thinking-recommendation' : ''}`}>
        <div
          className="thinking-header"
          onClick={() => !isStreaming && setThinkingExpanded(!thinkingExpanded)}
        >
          <span className="thinking-icon">
            {isStreaming ? (
              <span className="thinking-spinner" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                <path d="M10 21h4"/>
              </svg>
            )}
          </span>
          <span className="thinking-label">
            {isStreaming ? '正在深度分析...' : (isRecommendation ? '💡 推荐推理过程' : '思考过程')}
          </span>
          {!isStreaming && (
            <span className={`thinking-arrow ${thinkingExpanded ? 'up' : 'down'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </span>
          )}
        </div>
        {(thinkingExpanded || isStreaming) && (
          <div className="thinking-content">
            {renderThinkingContent(message.thinking)}
            {isStreaming && <span className="thinking-cursor">|</span>}
          </div>
        )}
      </div>
    );
  };

  // 渲染思考内容（支持基础格式化）
  const renderThinkingContent = (text) => {
    if (!text) return null;
    // 将思考内容按段落分割，简单格式化
    const paragraphs = text.split('\n');
    return paragraphs.map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      return <div key={i} className="thinking-line">{line}</div>;
    });
  };

  const isHumanAgent = message.role === 'human-agent';

  // 确定消息行样式
  const rowClass = isUser ? 'message-user' : (isHumanAgent ? 'message-human-agent' : 'message-ai');
  const bubbleClass = isUser ? 'bubble-user' : (isHumanAgent ? 'bubble-human-agent' : 'bubble-ai');

  return (
    <div className={`message-row ${rowClass}`}>
      {/* 人工顾问头像 */}
      {isHumanAgent && (
        <div className="human-agent-avatar">
          <span className="human-agent-avatar-icon">👨‍💼</span>
        </div>
      )}
      <div className={`bubble ${bubbleClass}`}>
        {/* 人工顾问名称标签 */}
        {isHumanAgent && message.agentName && (
          <div className="human-agent-name">{message.agentName}</div>
        )}
        {!isUser && !isHumanAgent && renderThinking()}
        {message.content ? (
          <>
            {renderContent(message.content)}
            {message.isStreaming && <span className="streaming-cursor">|</span>}
          </>
        ) : (
          message.isStreaming && !message.thinking && (
            <span className="streaming-cursor">|</span>
          )
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
