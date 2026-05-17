import React from 'react';
import '../styles/cards.css';

/**
 * ProfileSummary — 用户画像摘要卡片（通道A模式）
 * 展示风险评测问卷采集的信息
 */
function ProfileSummary({ data }) {
  if (!data) return null;

  return (
    <div className="profile-summary-wrapper">
      <div className="profile-summary-avatar">
        <div className="ai-avatar">
          <span>🤖</span>
        </div>
      </div>
      <div className="profile-summary-card">
        <div className="profile-summary-header">
          <span className="profile-icon">📊</span>
          <span className="profile-title">你的画像信息（来自风险评测）</span>
        </div>
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">性别年龄</span>
            <span className="profile-value">{data.gender}·{data.ageRange || '未知'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">家庭人数</span>
            <span className="profile-value">{data.familySize || '未知'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">收入区间</span>
            <span className="profile-value">{data.incomeRange || '未提供'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">负债情况</span>
            <span className="profile-value">{data.debt || '未提供'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">收入稳定性</span>
            <span className="profile-value">{data.incomeStability || '未提供'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">保险了解程度</span>
            <span className="profile-value">{data.insuranceKnowledge || '未提供'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">最关注问题</span>
            <span className="profile-value">{data.topConcern || '未提供'}</span>
          </div>
        </div>
        <div className="profile-note">
          ℹ️ 以上信息来自你的风险评测问卷，AI不会重复询问这些信息
        </div>
      </div>
    </div>
  );
}

export default ProfileSummary;
