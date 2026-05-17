import React from 'react';
import '../styles/cards.css';

/**
 * ProductComparison — 产品对比表格卡片
 */
function ProductComparison({ data }) {
  if (!data || !data.products) return null;

  return (
    <div className="comparison-wrapper">
      <div className="comparison-avatar">
        <div className="ai-avatar">
          <span>🤖</span>
        </div>
      </div>
      <div className="comparison-card">
        <div className="comparison-header">
          <span className="comparison-icon">📊</span>
          <span className="comparison-title">产品对比</span>
          <span className="comparison-scenario">{data.scenario}</span>
        </div>
        <div className="comparison-table-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="col-label">指标</th>
                {data.products.map((p, i) => (
                  <th key={i} className="col-product">
                    <div className="product-name-cell">{p.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">IRR</td>
                {data.products.map((p, i) => (
                  <td key={i} className="row-value highlight">{p.irr}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">回本年限</td>
                {data.products.map((p, i) => (
                  <td key={i} className="row-value">{p.breakeven}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">10年现金价值</td>
                {data.products.map((p, i) => (
                  <td key={i} className="row-value">{p.cv_10y}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">20年现金价值</td>
                {data.products.map((p, i) => (
                  <td key={i} className="row-value">{p.cv_20y}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">30年现金价值</td>
                {data.products.map((p, i) => (
                  <td key={i} className="row-value">{p.cv_30y}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">亮点</td>
                {data.products.map((p, i) => (
                  <td key={i} className="row-value small">{p.highlight}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductComparison;
