import React, { useState } from 'react';
import '../styles/messages.css';

/**
 * PurchaseLink — 投保跳转链接卡片
 * 展示产品投保入口，点击跳转（Demo中为模拟链接）
 */
function PurchaseLink({ data }) {
  const [clicked, setClicked] = useState(false);
  const { productName, insurer, category, categoryIcon, link, tags } = data;

  const handleClick = () => {
    setClicked(true);
    // Demo 中模拟跳转效果
    setTimeout(() => {
      window.open(link, '_blank', 'noopener,noreferrer');
    }, 300);
  };

  return (
    <div className="purchase-link-wrapper">
      <div className="purchase-link-card">
        {/* 卡片头部 */}
        <div className="purchase-link-header">
          <span className="purchase-link-icon">{categoryIcon}</span>
          <div className="purchase-link-header-text">
            <span className="purchase-link-product-name">{productName}</span>
            {insurer && <span className="purchase-link-insurer">{insurer}</span>}
          </div>
          {category && <span className="purchase-link-category">{category}</span>}
        </div>

        {/* 产品标签 */}
        {tags && tags.length > 0 && (
          <div className="purchase-link-tags">
            {tags.map((tag, i) => (
              <span key={i} className="purchase-link-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* 分隔线 */}
        <div className="purchase-link-divider" />

        {/* 投保按钮 */}
        <button
          className={`purchase-link-btn ${clicked ? 'clicked' : ''}`}
          onClick={handleClick}
        >
          <span className="purchase-link-btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </span>
          <span className="purchase-link-btn-text">
            {clicked ? '正在跳转...' : '立即投保'}
          </span>
          <span className="purchase-link-btn-arrow">→</span>
        </button>

        {/* 底部合规提示 */}
        <div className="purchase-link-disclaimer">
          <span className="purchase-link-disclaimer-icon">ⓘ</span>
          投保前请仔细阅读《保险条款》《健康告知》《免责声明》
        </div>
      </div>
    </div>
  );
}

export default PurchaseLink;
