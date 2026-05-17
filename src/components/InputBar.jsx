import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import productsData from '../data/products.json';
import '../styles/inputbar.css';

/**
 * 意图快捷按钮配置
 */
const INTENT_SHORTCUTS = [
  { key: 'PRODUCT_RECOMMEND', label: '产品推荐', icon: '🛡️', tag: '推荐' },
  { key: 'PRODUCT_DETAIL', label: '产品咨询', icon: '💬', tag: '咨询', needsProductSelect: 'single' },
  { key: 'PRODUCT_COMPARE', label: '产品对比', icon: '📊', tag: '对比', needsProductSelect: 'double' },
];

/**
 * InputBar — 底部输入栏
 * 含意图快捷按钮 + 输入框 + 发送
 * 
 * @param {Function} onSend - 发送消息回调 (text, forcedIntent?) => void
 * @param {boolean} isTyping - AI正在回复中
 */
function InputBar({ onSend, isTyping }) {
  const [text, setText] = useState('');
  const [activeIntent, setActiveIntent] = useState(null); // 当前选中的意图快捷键
  const [showProductPanel, setShowProductPanel] = useState(false); // 是否显示产品选择面板
  const [productSelectMode, setProductSelectMode] = useState(null); // 'single' | 'double'
  const [selectedProduct1, setSelectedProduct1] = useState(''); // 产品咨询 / 对比产品A
  const [selectedProduct2, setSelectedProduct2] = useState(''); // 对比产品B
  const [dropdownOpen1, setDropdownOpen1] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);
  const [searchText1, setSearchText1] = useState('');
  const [searchText2, setSearchText2] = useState('');
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // 构建产品列表（按类目分组）
  const productGroups = useMemo(() => {
    const categories = productsData.categories;
    const products = productsData.products;
    const groups = {};

    products.forEach(p => {
      const catKey = p.category;
      const catName = categories[catKey]?.name || catKey;
      if (!groups[catKey]) {
        groups[catKey] = {
          name: catName,
          icon: categories[catKey]?.icon || '📋',
          products: [],
        };
      }
      groups[catKey].products.push({ id: p.id, name: p.name, insurer: p.insurer });
    });

    return Object.values(groups);
  }, []);

  // 扁平化产品列表用于搜索
  const allProducts = useMemo(() => {
    return productsData.products.map(p => ({
      id: p.id,
      name: p.name,
      insurer: p.insurer,
      category: productsData.categories[p.category]?.name || p.category,
      categoryIcon: productsData.categories[p.category]?.icon || '📋',
    }));
  }, []);

  // 过滤产品
  const getFilteredProducts = useCallback((searchStr) => {
    if (!searchStr.trim()) return productGroups;
    const keyword = searchStr.toLowerCase();
    const filtered = [];
    productGroups.forEach(group => {
      const matched = group.products.filter(
        p => p.name.toLowerCase().includes(keyword) || p.insurer.toLowerCase().includes(keyword)
      );
      if (matched.length > 0) {
        filtered.push({ ...group, products: matched });
      }
    });
    return filtered;
  }, [productGroups]);

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowProductPanel(false);
        setDropdownOpen1(false);
        setDropdownOpen2(false);
      }
    };
    if (showProductPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProductPanel]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!text.trim() || isTyping) return;
    // 发送时传递强制意图
    onSend(text.trim(), activeIntent);
    setText('');
    setActiveIntent(null); // 发送后清除意图标识
    setShowProductPanel(false);
    inputRef.current?.focus();
  }, [text, isTyping, activeIntent, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // 点击意图快捷按钮
  const handleIntentClick = useCallback((intentKey) => {
    const shortcut = INTENT_SHORTCUTS.find(s => s.key === intentKey);

    if (activeIntent === intentKey) {
      // 再次点击取消选中
      setActiveIntent(null);
      setShowProductPanel(false);
      setProductSelectMode(null);
    } else {
      setActiveIntent(intentKey);

      // 如果需要产品选择，弹出面板
      if (shortcut?.needsProductSelect) {
        setProductSelectMode(shortcut.needsProductSelect);
        setShowProductPanel(true);
        setSelectedProduct1('');
        setSelectedProduct2('');
        setSearchText1('');
        setSearchText2('');
        setDropdownOpen1(false);
        setDropdownOpen2(false);
      } else {
        setShowProductPanel(false);
        setProductSelectMode(null);
        inputRef.current?.focus();
      }
    }
  }, [activeIntent]);

  // 清除已选意图标识
  const handleClearIntent = useCallback(() => {
    setActiveIntent(null);
    setShowProductPanel(false);
    setProductSelectMode(null);
    inputRef.current?.focus();
  }, []);

  // 选择产品后的处理
  const handleProductSelect1 = useCallback((productName) => {
    setSelectedProduct1(productName);
    setDropdownOpen1(false);
    setSearchText1('');

    if (productSelectMode === 'single') {
      // 产品咨询：选中即发送
      const sendText = `想了解「${productName}」的详细信息`;
      onSend(sendText, 'PRODUCT_DETAIL');
      setActiveIntent(null);
      setShowProductPanel(false);
      setProductSelectMode(null);
      setSelectedProduct1('');
    }
    // 对比模式等两个都选完
  }, [productSelectMode, onSend]);

  const handleProductSelect2 = useCallback((productName) => {
    setSelectedProduct2(productName);
    setDropdownOpen2(false);
    setSearchText2('');
  }, []);

  // 产品对比确认发送
  const handleCompareSubmit = useCallback(() => {
    if (!selectedProduct1 || !selectedProduct2) return;
    if (selectedProduct1 === selectedProduct2) return;
    const sendText = `帮我对比一下「${selectedProduct1}」和「${selectedProduct2}」`;
    onSend(sendText, 'PRODUCT_COMPARE');
    setActiveIntent(null);
    setShowProductPanel(false);
    setProductSelectMode(null);
    setSelectedProduct1('');
    setSelectedProduct2('');
  }, [selectedProduct1, selectedProduct2, onSend]);

  const activeShortcut = INTENT_SHORTCUTS.find(s => s.key === activeIntent);

  // 下拉列表渲染
  const renderDropdownList = (searchStr, onSelect, excludeName) => {
    const filtered = getFilteredProducts(searchStr);
    if (filtered.length === 0) {
      return <div className="product-dropdown-empty">未找到匹配的产品</div>;
    }
    return filtered.map((group, gi) => (
      <div key={gi} className="product-dropdown-group">
        <div className="product-dropdown-group-label">
          <span className="product-dropdown-group-icon">{group.icon}</span>
          {group.name}
        </div>
        {group.products.map(p => (
          <button
            key={p.id}
            className={`product-dropdown-item ${p.name === excludeName ? 'disabled' : ''}`}
            onClick={() => p.name !== excludeName && onSelect(p.name)}
            disabled={p.name === excludeName}
          >
            <span className="product-dropdown-item-name">{p.name}</span>
            <span className="product-dropdown-item-insurer">{p.insurer}</span>
          </button>
        ))}
      </div>
    ));
  };

  return (
    <div className="inputbar-wrapper">
      {/* 产品选择面板 */}
      {showProductPanel && (
        <div className="product-select-panel" ref={panelRef}>
          <div className="product-select-panel-header">
            <span className="product-select-panel-title">
              {productSelectMode === 'single' ? '💬 选择咨询产品' : '📊 选择对比产品'}
            </span>
            <button className="product-select-panel-close" onClick={() => {
              setShowProductPanel(false);
              setActiveIntent(null);
              setProductSelectMode(null);
            }}>×</button>
          </div>

          {productSelectMode === 'single' ? (
            /* 单选模式 */
            <div className="product-select-single">
              <div className="product-select-field">
                <label className="product-select-label">选择产品</label>
                <div className="product-dropdown-wrapper">
                  <div
                    className={`product-dropdown-trigger ${dropdownOpen1 ? 'open' : ''}`}
                    onClick={() => setDropdownOpen1(!dropdownOpen1)}
                  >
                    <span className={selectedProduct1 ? 'has-value' : 'placeholder'}>
                      {selectedProduct1 || '请选择要咨询的产品...'}
                    </span>
                    <span className="product-dropdown-arrow">
                      {dropdownOpen1 ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen1 && (
                    <div className="product-dropdown-menu">
                      <div className="product-dropdown-search">
                        <input
                          type="text"
                          placeholder="搜索产品名称..."
                          value={searchText1}
                          onChange={e => setSearchText1(e.target.value)}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="product-dropdown-list">
                        {renderDropdownList(searchText1, handleProductSelect1, null)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 双选模式 */
            <div className="product-select-double">
              {/* 产品A */}
              <div className="product-select-field">
                <label className="product-select-label">产品 A</label>
                <div className="product-dropdown-wrapper">
                  <div
                    className={`product-dropdown-trigger ${dropdownOpen1 ? 'open' : ''}`}
                    onClick={() => { setDropdownOpen1(!dropdownOpen1); setDropdownOpen2(false); }}
                  >
                    <span className={selectedProduct1 ? 'has-value' : 'placeholder'}>
                      {selectedProduct1 || '请选择第一个产品...'}
                    </span>
                    <span className="product-dropdown-arrow">
                      {dropdownOpen1 ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen1 && (
                    <div className="product-dropdown-menu">
                      <div className="product-dropdown-search">
                        <input
                          type="text"
                          placeholder="搜索产品名称..."
                          value={searchText1}
                          onChange={e => setSearchText1(e.target.value)}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="product-dropdown-list">
                        {renderDropdownList(searchText1, handleProductSelect1, selectedProduct2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VS 分隔 */}
              <div className="product-compare-vs">VS</div>

              {/* 产品B */}
              <div className="product-select-field">
                <label className="product-select-label">产品 B</label>
                <div className="product-dropdown-wrapper">
                  <div
                    className={`product-dropdown-trigger ${dropdownOpen2 ? 'open' : ''}`}
                    onClick={() => { setDropdownOpen2(!dropdownOpen2); setDropdownOpen1(false); }}
                  >
                    <span className={selectedProduct2 ? 'has-value' : 'placeholder'}>
                      {selectedProduct2 || '请选择第二个产品...'}
                    </span>
                    <span className="product-dropdown-arrow">
                      {dropdownOpen2 ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen2 && (
                    <div className="product-dropdown-menu">
                      <div className="product-dropdown-search">
                        <input
                          type="text"
                          placeholder="搜索产品名称..."
                          value={searchText2}
                          onChange={e => setSearchText2(e.target.value)}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="product-dropdown-list">
                        {renderDropdownList(searchText2, handleProductSelect2, selectedProduct1)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 确认按钮 */}
              <button
                className={`product-compare-submit ${selectedProduct1 && selectedProduct2 && selectedProduct1 !== selectedProduct2 ? 'ready' : ''}`}
                onClick={handleCompareSubmit}
                disabled={!selectedProduct1 || !selectedProduct2 || selectedProduct1 === selectedProduct2}
              >
                {!selectedProduct1 || !selectedProduct2
                  ? '请选择两个产品'
                  : selectedProduct1 === selectedProduct2
                    ? '请选择不同的产品'
                    : '开始对比'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 意图快捷按钮区域 */}
      <div className="intent-shortcuts">
        {INTENT_SHORTCUTS.map((shortcut) => (
          <button
            key={shortcut.key}
            className={`intent-shortcut-btn ${activeIntent === shortcut.key ? 'active' : ''}`}
            onClick={() => handleIntentClick(shortcut.key)}
            disabled={isTyping}
          >
            <span className="intent-shortcut-icon">{shortcut.icon}</span>
            <span className="intent-shortcut-label">{shortcut.label}</span>
          </button>
        ))}
      </div>

      {/* 输入区域 */}
      <div className="inputbar">
        {/* 输入框 */}
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="input-field-wrapper">
            {/* 已选意图标识 */}
            {activeShortcut && !showProductPanel && (
              <span className="intent-tag">
                <span className="intent-tag-icon">{activeShortcut.icon}</span>
                <span className="intent-tag-text">{activeShortcut.tag}</span>
                <button
                  className="intent-tag-close"
                  onClick={handleClearIntent}
                  type="button"
                  aria-label="取消意图"
                >
                  ×
                </button>
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              className={`chat-input ${activeShortcut && !showProductPanel ? 'has-intent-tag' : ''}`}
              placeholder={activeShortcut ? `输入${activeShortcut.label}相关问题...` : '欢迎向小招提问~'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
          </div>
        </form>

        {/* 右侧按钮组 */}
        <div className="input-actions-right">
          {text.trim() ? (
            <button
              className="input-action-btn send-btn"
              onClick={handleSubmit}
              disabled={isTyping}
              aria-label="发送"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          ) : (
            <>
              {/* (+) 圆圈加号 */}
              <button className="input-action-btn" aria-label="更多功能">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
              {/* 四格图标 */}
              <button className="input-action-btn" aria-label="功能面板">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="8" height="8" rx="1.5"/>
                  <rect x="13" y="3" width="8" height="8" rx="1.5"/>
                  <rect x="13" y="13" width="8" height="8" rx="1.5"/>
                  <rect x="3" y="13" width="8" height="8" rx="1.5"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 合规提示用语 */}
      <div className="compliance-notice">
        部分内容为AI生成仅供参考，不构成保险服务建议
      </div>

      {/* 安全区域底部间距 */}
      <div className="safe-bottom" />
    </div>
  );
}

export default InputBar;
