import React from 'react';
import '../styles/messages.css';

/**
 * TypingIndicator — 正在输入动画
 * 不带AI头像
 */
function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

export default TypingIndicator;
