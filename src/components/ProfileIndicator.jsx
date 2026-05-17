import React from 'react';
import '../styles/cards.css';

/**
 * ProfileIndicator — FIND采集进度指示器
 * 显示四维度（F/I/N/D）的采集状态
 */
function ProfileIndicator({ findProfile, channelMode }) {
  const dimensions = [
    { key: 'F', label: '家庭', icon: '👨‍👩‍👧', color: '#4A7FE5' },
    { key: 'I', label: '经济', icon: '💰', color: '#12B282' },
    { key: 'N', label: '需求', icon: '🎯', color: '#FF9800' },
    { key: 'D', label: '健康', icon: '❤️', color: '#C02C38' }
  ];

  return (
    <div className="profile-indicator">
      <div className="indicator-inner">
        {dimensions.map((dim) => {
          const isCollected = findProfile[dim.key]?.collected;
          return (
            <div
              key={dim.key}
              className={`indicator-item ${isCollected ? 'collected' : ''}`}
            >
              <span className="indicator-icon">{dim.icon}</span>
              <span className="indicator-label">{dim.label}</span>
              <div
                className="indicator-dot"
                style={{ background: isCollected ? dim.color : '#D8DAE5' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileIndicator;
