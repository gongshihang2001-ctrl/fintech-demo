import React from 'react';
import '../styles/cards.css';

/**
 * SuggestionCard — "小招建议"卡片
 * 基于截图：橙色渐变"小招建议"标题+建议正文+描述段落
 */
function SuggestionCard({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="suggestion-card-wrapper">
      <div className="suggestion-card">
        {suggestions.map((s, index) => (
          <div key={index} className="suggestion-item" style={{ animationDelay: `${index * 0.15}s` }}>
            <div className="suggestion-header">
              <span className="suggestion-title">小招建议</span>
            </div>
            <div className="suggestion-tag-row">
              <span className="suggestion-item-title">{s.title}</span>
            </div>
            {s.desc && <div className="suggestion-desc">{s.desc}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuggestionCard;
