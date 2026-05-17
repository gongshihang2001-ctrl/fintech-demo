import React from 'react';
import '../styles/settings.css';

/**
 * SettingsPanel — 设置面板
 * 通道切换、API配置、用户画像模拟
 */
function SettingsPanel({ channelMode, onChannelChange, apiConfig, onApiConfigChange, userProfile, onUserProfileChange, surveyCompleted, onClose }) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="settings-header">
          <span className="settings-title">⚙️ Demo 设置</span>
          <button className="settings-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* 通道模式切换 */}
          <div className="settings-section">
            <div className="section-title">📡 数据通道模式</div>
            <div className="section-desc">
              通道A：模拟已有风险评测数据（F和I已填充）<br />
              通道B：纯对话模式，从零开始采集
            </div>
            <div className="channel-switch">
              <button
                className={`channel-btn ${channelMode === 'A' ? 'active' : ''}`}
                onClick={() => onChannelChange('A')}
              >
                <span className="channel-icon">📊</span>
                <span>通道A · 评测复用</span>
              </button>
              <button
                className={`channel-btn ${channelMode === 'B' ? 'active' : ''}`}
                onClick={() => onChannelChange('B')}
              >
                <span className="channel-icon">💬</span>
                <span>通道B · 对话采集</span>
              </button>
            </div>
            <div className="channel-note">
              ⚠️ 切换通道会重新开始对话
            </div>
          </div>

          {/* API配置 */}
          <div className="settings-section">
            <div className="section-title">🔑 AI API 配置</div>
            <div className="section-desc">
              配置OpenAI兼容格式的API。未配置时使用预设Demo对话。
            </div>
            <div className="form-group">
              <label className="form-label">API Base URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://api.openai.com/v1"
                value={apiConfig.baseUrl}
                onChange={e => onApiConfigChange({ ...apiConfig, baseUrl: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="sk-..."
                value={apiConfig.apiKey}
                onChange={e => onApiConfigChange({ ...apiConfig, apiKey: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">模型名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="gpt-4o-mini"
                value={apiConfig.model}
                onChange={e => onApiConfigChange({ ...apiConfig, model: e.target.value })}
              />
            </div>
          </div>

          {/* 用户画像 */}
          <div className="settings-section">
            <div className="section-title">👤 用户画像</div>
            {surveyCompleted ? (
              <div className="section-desc">
                画像信息来自风险评测问卷，不可修改
              </div>
            ) : (
              <div className="section-desc">
                尚未完成风险评测问卷，请点击右上角评测按钮填写
              </div>
            )}
            {surveyCompleted && userProfile.riskAssessment && (
              <div className="profile-read-only">
                <div className="profile-read-item">
                  <span className="form-label">性别</span>
                  <span className="profile-read-value">{userProfile.gender}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">年龄段</span>
                  <span className="profile-read-value">{userProfile.ageRange}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">家庭人数</span>
                  <span className="profile-read-value">{userProfile.riskAssessment.familySize}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">家庭年收入</span>
                  <span className="profile-read-value">{userProfile.riskAssessment.incomeRange}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">负债情况</span>
                  <span className="profile-read-value">{userProfile.riskAssessment.debt}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">收入稳定性</span>
                  <span className="profile-read-value">{userProfile.riskAssessment.incomeStability}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">保险了解程度</span>
                  <span className="profile-read-value">{userProfile.riskAssessment.insuranceKnowledge}</span>
                </div>
                <div className="profile-read-item">
                  <span className="form-label">最关注问题</span>
                  <span className="profile-read-value">{userProfile.riskAssessment.topConcern}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
