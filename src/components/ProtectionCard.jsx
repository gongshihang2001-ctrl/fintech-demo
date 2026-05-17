import React from 'react';
import '../styles/cards.css';

/**
 * ProtectionCard — 三张保单保障情况卡片
 * 基于截图：三列无分隔线，标题在列顶部，子项目是"险种名 + 灰色圆点 + 未保障"，底部"查看详情>"链接
 */
function ProtectionCard({ data, inline, userProfile, channelMode }) {
  const protectionData = data || {
    health: {
      status: 'partial',
      items: [
        { name: '医疗险', tag: '优先', covered: false },
        { name: '重疾险', tag: null, covered: false }
      ]
    },
    life: {
      status: 'missing',
      items: [
        { name: '意外险', tag: null, covered: false },
        { name: '定寿', tag: null, covered: false }
      ]
    },
    savings: {
      status: 'missing',
      items: [
        { name: '养老金', tag: null, covered: false },
        { name: '积蓄金', tag: null, covered: false }
      ]
    }
  };

  const columns = [
    { title: '健康保障', key: 'health', data: protectionData.health },
    { title: '人身保障', key: 'life', data: protectionData.life },
    { title: '长期储备', key: 'savings', data: protectionData.savings }
  ];

  return (
    <div className={`protection-card ${inline ? 'protection-inline' : ''}`}>
      <div className="protection-grid">
        {columns.map((col) => (
          <div key={col.key} className="protection-col">
            <div className="protection-col-title">{col.title}</div>
            <div className="protection-items">
              {(col.data?.items || []).map((item, i) => {
                const itemName = typeof item === 'string' ? item : item.name;
                const itemTag = typeof item === 'object' ? item.tag : null;
                return (
                  <div key={i} className="protection-item">
                    <span className="protection-dot" />
                    <span>{itemName}</span>
                    {itemTag && (
                      <span style={{
                        display: 'inline-block',
                        padding: '0 4px',
                        borderRadius: '2px',
                        fontSize: '9px',
                        fontWeight: 600,
                        background: '#FFF3E0',
                        color: '#FF8C00',
                        border: '0.5px solid #FFD699',
                        marginLeft: '2px',
                        lineHeight: '16px'
                      }}>
                        {itemTag}
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="protection-item" style={{ color: '#BFBFBF', fontSize: '11px' }}>
                <span className="protection-dot" />
                未保障
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 查看详情 */}
      <div className="protection-footer">
        <button className="protection-detail-link">
          查看详情 &gt;
        </button>
      </div>
    </div>
  );
}

export default ProtectionCard;
