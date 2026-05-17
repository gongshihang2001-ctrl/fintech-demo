import React from 'react';
import '../styles/cards.css';

/**
 * QuickReplies — 快捷回复按钮组
 * 基于截图：蓝色边框胶囊按钮，纵向排列，靠右对齐
 */
function QuickReplies({ options, onSelect }) {
  return (
    <div className="quick-replies-row">
      <div className="quick-replies">
        {options.map((opt, index) => (
          <button
            key={index}
            className="quick-reply-btn"
            onClick={() => onSelect(opt.text)}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <span className="qr-text">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickReplies;
