import React from 'react';
import '../styles/messages.css';

/**
 * TransferDivider — 转人工分隔符
 * 在 AI 对话和人工顾问对话之间展示分隔线
 */
function TransferDivider({ message }) {
  return (
    <div className="transfer-divider">
      <div className="transfer-divider-line" />
      <div className="transfer-divider-content">
        <span className="transfer-divider-icon">🔄</span>
        <span className="transfer-divider-text">{message.content || '正在转接人工顾问...'}</span>
      </div>
      <div className="transfer-divider-line" />
    </div>
  );
}

export default TransferDivider;
