import React, { useState, useCallback } from 'react';
import ChatScreen from './components/ChatScreen';
import SettingsPanel from './components/SettingsPanel';
import RiskSurveyModal from './components/RiskSurveyModal';
import './styles/app.css';

/**
 * AI保险顾问 Demo — 主应用
 * 内嵌在招行App保险板块的对话助手界面
 */
function App() {
  // 通道模式：A=评测数据复用 B=对话采集
  const [channelMode, setChannelMode] = useState('B');
  // 设置面板开关
  const [showSettings, setShowSettings] = useState(false);
  // 问卷弹窗开关
  const [showSurvey, setShowSurvey] = useState(false);
  // 问卷是否已完成
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  // API配置 — 走Vercel服务端代理，Key无需前端传入
  const [apiConfig, setApiConfig] = useState({
    baseUrl: '/api',
    apiKey: '',
    model: 'deepseek-chat'
  });
  // 用户画像（初始为空，完成问卷后填充）
  const [userProfile, setUserProfile] = useState({
    gender: '',
    ageRange: '',
    riskAssessment: null
  });

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleOpenSurvey = useCallback(() => {
    setShowSurvey(true);
  }, []);

  const handleCloseSurvey = useCallback(() => {
    setShowSurvey(false);
  }, []);

  const handleSurveyComplete = useCallback((profile) => {
    setUserProfile(profile);
    setSurveyCompleted(true);
    setChannelMode('A'); // 完成问卷自动切到通道A
    setShowSurvey(false);
  }, []);

  return (
    <div className="app-container">
      {/* 主聊天界面 */}
      <ChatScreen
        channelMode={channelMode}
        apiConfig={apiConfig}
        userProfile={userProfile}
        surveyCompleted={surveyCompleted}
        onOpenSettings={handleToggleSettings}
        onOpenSurvey={handleOpenSurvey}
      />

      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel
          channelMode={channelMode}
          onChannelChange={setChannelMode}
          apiConfig={apiConfig}
          onApiConfigChange={setApiConfig}
          userProfile={userProfile}
          onUserProfileChange={setUserProfile}
          surveyCompleted={surveyCompleted}
          onClose={handleToggleSettings}
        />
      )}

      {/* 风险评测问卷弹窗 */}
      {showSurvey && (
        <RiskSurveyModal
          onComplete={handleSurveyComplete}
          onClose={handleCloseSurvey}
        />
      )}
    </div>
  );
}

export default App;
