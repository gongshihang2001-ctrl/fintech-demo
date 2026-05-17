import React from 'react';
import '../styles/navbar.css';

/**
 * NavBar — 顶部导航栏
 * 基于截图：白底，左侧返回箭头，中间彩色渐变AI头像，右侧按钮
 */
function NavBar({ channelMode, onOpenSettings, onShowProtection, onNewChat, onOpenSurvey, surveyCompleted }) {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        {/* 左侧：返回箭头 */}
        <div className="navbar-left">
          <button className="nav-btn nav-back" aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* 中间：AI头像（星火/智慧光芒图标） */}
        <div className="navbar-center">
          <div className="ai-avatar-nav">
            <svg className="ai-avatar-nav-svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
              {/* 中心圆点 */}
              <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.95)"/>
              {/* 四条主光芒 */}
              <line x1="12" y1="2" x2="12" y2="7" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12" y2="22" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="7" y2="12" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="17" y1="12" x2="22" y2="12" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
              {/* 四条斜光芒（较短） */}
              <line x1="5.64" y1="5.64" x2="8.46" y2="8.46" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="15.54" y1="15.54" x2="18.36" y2="18.36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="18.36" y1="5.64" x2="15.54" y2="8.46" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="8.46" y1="15.54" x2="5.64" y2="18.36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* 右侧：风险评测 + 新建会话按钮 */}
        <div className="navbar-right">
          <button className="nav-btn nav-survey" aria-label="风险评测" onClick={onOpenSurvey}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span className={`nav-survey-dot ${surveyCompleted ? 'completed' : ''}`}></span>
          </button>
          <button className="nav-btn nav-new-chat" aria-label="新建会话" onClick={onNewChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {/* 编辑/新建图标：方块+笔 */}
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
