import React, { useState } from 'react';
import '../styles/recommendation.css';

/**
 * RecommendationCard — 产品推荐卡片
 * 底部有方案切换tab，卡片内展示产品亮点、主要保障范围、推荐理由
 * 不展示预计保费
 */
function RecommendationCard({ data, onProductClick }) {
  const { plans } = data;
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  if (!plans || plans.length === 0) return null;

  const activePlan = plans[activePlanIndex];

  return (
    <div className="recommendation-wrapper">
      <div className="recommendation-card">
        {/* 卡片头部 */}
        <div className="rec-card-header">
          <span className="rec-card-badge">AI 推荐</span>
          <span className="rec-card-title">为你定制的保障方案</span>
        </div>

        {/* 产品内容区域 */}
        <div className="rec-card-body">
          {/* 产品名称 */}
          <div className="rec-product-name">
            <span className="rec-product-icon">🛡️</span>
            <span>{activePlan.productName}</span>
          </div>

          {/* 产品亮点 */}
          <div className="rec-section">
            <div className="rec-section-label">
              <span className="rec-label-dot highlight-dot" />
              产品亮点
            </div>
            <div className="rec-highlights">
              {activePlan.highlights.map((item, i) => (
                <span key={i} className="rec-highlight-tag">{item}</span>
              ))}
            </div>
          </div>

          {/* 主要保障范围 */}
          <div className="rec-section">
            <div className="rec-section-label">
              <span className="rec-label-dot coverage-dot" />
              主要保障范围
            </div>
            <div className="rec-coverage-list">
              {activePlan.coverageItems.map((item, i) => (
                <div key={i} className="rec-coverage-item">
                  <span className="rec-coverage-check">✓</span>
                  <span className="rec-coverage-text">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 推荐理由 */}
          <div className="rec-section">
            <div className="rec-section-label">
              <span className="rec-label-dot reason-dot" />
              推荐理由
            </div>
            <div className="rec-reason">
              {activePlan.reason}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="rec-actions">
            <button
              className="rec-action-btn rec-btn-detail"
              onClick={() => onProductClick && onProductClick(activePlan, 'detail')}
            >
              查看详情
            </button>
            <button
              className="rec-action-btn rec-btn-purchase"
              onClick={() => onProductClick && onProductClick(activePlan, 'purchase')}
            >
              立即投保
            </button>
            <button
              className="rec-action-btn rec-btn-consult"
              onClick={() => onProductClick && onProductClick(activePlan, 'consult')}
            >
              咨询顾问
            </button>
          </div>
        </div>

        {/* 底部方案切换 Tab */}
        {plans.length > 1 && (
          <div className="rec-tabs">
            {plans.map((plan, index) => (
              <button
                key={index}
                className={`rec-tab ${index === activePlanIndex ? 'rec-tab-active' : ''}`}
                onClick={() => setActivePlanIndex(index)}
              >
                <span className="rec-tab-label">方案{index + 1}</span>
                <span className="rec-tab-name">{plan.planLabel || plan.productName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationCard;
