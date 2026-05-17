import React, { useState, useRef, useEffect, useCallback } from 'react';
import NavBar from './NavBar';
import MessageList from './MessageList';
import InputBar from './InputBar';
import ProtectionCard from './ProtectionCard';
import SuggestionCard from './SuggestionCard';
import QuickReplies from './QuickReplies';
import { buildModulePrompt } from '../utils/promptBuilder';
import { callAIStream } from '../utils/apiClient';
import { routeIntent, INTENTS, MODULE_CONFIG, analyzeClarifyState } from '../utils/intentRouter';
import productsData from '../data/products.json';
import '../styles/chat.css';
import '../styles/survey.css';

/**
 * ChatScreen — 主聊天界面
 * 复刻招行App保险板块的AI对话助手界面
 */
function ChatScreen({ channelMode, apiConfig, userProfile, surveyCompleted, onOpenSettings, onOpenSurvey }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [findProfile, setFindProfile] = useState({
    F: { collected: channelMode === 'A', data: channelMode === 'A' ? userProfile.riskAssessment : {} },
    I: { collected: channelMode === 'A', data: channelMode === 'A' ? { incomeRange: userProfile.riskAssessment?.incomeRange } : {} },
    N: { collected: false, data: {} },
    D: { collected: false, data: {} }
  });
  const [currentScene, setCurrentScene] = useState(null);
  const [showProtectionCard, setShowProtectionCard] = useState(false);
  const [hasPromptedSurvey, setHasPromptedSurvey] = useState(false); // 是否已提示过填写问卷
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // 发送欢迎消息
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const welcomeMessages = [];
    
    if (channelMode === 'A' && surveyCompleted) {
      welcomeMessages.push({
        id: 'welcome-1',
        role: 'assistant',
        type: 'text',
        content: `你好！我是你的AI保险顾问小招 👋\n\n我看到你已经完成了风险评测，来帮你快速梳理一下：`,
        timestamp: Date.now()
      });
      welcomeMessages.push({
        id: 'welcome-profile',
        role: 'assistant',
        type: 'profile-summary',
        content: '',
        profileData: {
          gender: userProfile.gender,
          ageRange: userProfile.ageRange,
          ...userProfile.riskAssessment
        },
        timestamp: Date.now() + 100
      });
      welcomeMessages.push({
        id: 'welcome-2',
        role: 'assistant',
        type: 'text',
        content: '基于你的画像，我可以直接给你做保障分析。请问今天想了解哪方面？',
        timestamp: Date.now() + 200
      });
      welcomeMessages.push({
        id: 'welcome-quick',
        role: 'assistant',
        type: 'quick-replies',
        content: '',
        options: [
          { text: '帮我做保障规划', icon: '🛡️' },
          { text: '想了解增额终身寿', icon: '💰' },
          { text: '给孩子买保险', icon: '👶' },
          { text: '帮我看看保障够不够', icon: '🔍' }
        ],
        timestamp: Date.now() + 300
      });
    } else {
      welcomeMessages.push({
        id: 'welcome-1',
        role: 'assistant',
        type: 'text',
        content: `你好！我是你的AI保险顾问小招 👋\n\n我可以帮你分析保障需求、推荐适合的保险产品。有什么想了解的，尽管和我聊~`,
        timestamp: Date.now()
      });
      welcomeMessages.push({
        id: 'welcome-quick',
        role: 'assistant',
        type: 'quick-replies',
        content: '',
        options: [
          { text: '帮我从0开始规划保障', icon: '🛡️' },
          { text: '最近想了解增额终身寿', icon: '💰' },
          { text: '想给全家做保障方案', icon: '👨‍👩‍👧' },
          { text: '就随便看看', icon: '👀' }
        ],
        timestamp: Date.now() + 100
      });
    }

    // 模拟逐条弹出
    welcomeMessages.forEach((msg, index) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }, index * 600);
    });
  }, [channelMode, userProfile, surveyCompleted, scrollToBottom]);

  // 当问卷完成时，重新发送欢迎消息
  useEffect(() => {
    if (surveyCompleted && hasInitialized.current) {
      // 问卷刚完成，重新初始化对话
      hasInitialized.current = false;
      // 用 setTimeout 让状态更新后再触发
      setTimeout(() => {
        hasInitialized.current = true;
        setMessages([]);
        setFindProfile({
          F: { collected: true, data: userProfile.riskAssessment || {} },
          I: { collected: true, data: { incomeRange: userProfile.riskAssessment?.incomeRange } },
          N: { collected: false, data: {} },
          D: { collected: false, data: {} }
        });
        setHasPromptedSurvey(false);

        const welcomeMessages = [];
        welcomeMessages.push({
          id: 'welcome-1',
          role: 'assistant',
          type: 'text',
          content: `你好！我是你的AI保险顾问小招 👋\n\n我看到你已经完成了风险评测，来帮你快速梳理一下：`,
          timestamp: Date.now()
        });
        welcomeMessages.push({
          id: 'welcome-profile',
          role: 'assistant',
          type: 'profile-summary',
          content: '',
          profileData: {
            gender: userProfile.gender,
            ageRange: userProfile.ageRange,
            ...userProfile.riskAssessment
          },
          timestamp: Date.now() + 100
        });
        welcomeMessages.push({
          id: 'welcome-2',
          role: 'assistant',
          type: 'text',
          content: '基于你的画像，我可以直接给你做保障分析。请问今天想了解哪方面？',
          timestamp: Date.now() + 200
        });
        welcomeMessages.push({
          id: 'welcome-quick',
          role: 'assistant',
          type: 'quick-replies',
          content: '',
          options: [
            { text: '帮我做保障规划', icon: '🛡️' },
            { text: '想了解增额终身寿', icon: '💰' },
            { text: '给孩子买保险', icon: '👶' },
            { text: '帮我看看保障够不够', icon: '🔍' }
          ],
          timestamp: Date.now() + 300
        });

        welcomeMessages.forEach((msg, index) => {
          setTimeout(() => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
          }, index * 600);
        });
      }, 100);
    }
  }, [surveyCompleted]);

  // 处理发送消息
  const handleSend = useCallback(async (text, forcedIntent = null) => {
    if (!text.trim()) return;

    // 添加用户消息
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'text',
      content: text,
      _forcedIntent: forcedIntent || undefined,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    // 如果未完成问卷且还没提示过，在第一条用户消息的回复中提示填写问卷
    if (!surveyCompleted && !hasPromptedSurvey) {
      setHasPromptedSurvey(true);
    }

    // 如果没有配置API，使用模拟响应
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      const localIntent = forcedIntent || null;
      const purchasePatterns = [
        /想.*投保/, /要.*投保/, /确定.*投保/, /准备.*投保/, /打算.*投保/,
        /怎么买/, /怎么投保/, /如何购买/, /如何投保/,
        /我要买/, /想买这个/, /就买这个/, /就这个了/, /决定买/,
        /下单/, /购买/, /投保.*链接/, /投保.*入口/,
        /想买「.*」/, /要买「.*」/, /投保「.*」/,
        /在哪.*买/, /在哪.*投保/, /去哪.*买/, /去哪.*投保/
      ];
      const transferPatterns = [
        /转.*人工/, /咨询顾问/, /转.*顾问/, /人工.*服务/, /人工.*客服/,
        /找.*顾问/, /真人/, /转接/
      ];
      const textLower = text.toLowerCase();
      const isPurchase = localIntent === 'PURCHASE_INTENT' || purchasePatterns.some(p => p.test(textLower));
      const isTransfer = localIntent === 'TRANSFER_HUMAN' || transferPatterns.some(p => p.test(textLower));

      if (!isPurchase && !isTransfer) {
        setIsTyping(true);
        scrollToBottom();
        
        setTimeout(() => {
          const mockResponse = generateMockResponse(text, channelMode, userProfile, findProfile);
          setIsTyping(false);
          
          mockResponse.forEach((msg, index) => {
            setTimeout(() => {
              setMessages(prev => [...prev, msg]);
              scrollToBottom();
            }, index * 400);
          });
        }, 1500 + Math.random() * 1000);
        return;
      }
    }

    // ==================== 意图识别 ====================
    setIsTyping(true);
    scrollToBottom();

    const chatHistory = messages
      .filter(m => m.type === 'text')
      .map(m => ({ role: m.role, content: m.content }));
    chatHistory.push({ role: 'user', content: text });

    let routeResult;
    if (forcedIntent && INTENTS[forcedIntent]) {
      console.log(`[快捷意图] 用户选择了 ${forcedIntent}，跳过意图识别`);
      routeResult = {
        intent: forcedIntent,
        moduleConfig: MODULE_CONFIG[forcedIntent],
        forceRecommend: false,
      };
    } else {
      try {
        routeResult = await routeIntent(text, apiConfig, chatHistory, {
          messages,
          channelMode,
          userProfile,
          findProfile,
        });
      } catch (e) {
        console.warn('意图识别失败，使用默认推荐:', e);
        routeResult = {
          intent: INTENTS.PRODUCT_RECOMMEND,
          moduleConfig: MODULE_CONFIG[INTENTS.PRODUCT_RECOMMEND],
          forceRecommend: false,
        };
      }
    }

    const { intent, moduleConfig, forceRecommend } = routeResult;
    console.log(`[意图路由] ${intent}${forceRecommend ? ' (强制推荐)' : ''}`);

    // ==================== 转人工流程 ====================
    if (intent === INTENTS.TRANSFER_HUMAN) {
      setIsTyping(false);
      const now = Date.now();

      const productMatch = text.match(/[「"](.*?)[」"]/);
      const productName = productMatch ? productMatch[1] : null;

      const dividerMsg = {
        id: `divider-${now}`,
        type: 'transfer-divider',
        content: '正在为您转接专业保险顾问...',
        timestamp: now,
      };

      const welcomeContent = productName
        ? `您好，我是招行保险顾问小李。已了解到您想咨询「${productName}」相关问题，请问有什么可以帮您？`
        : `您好，我是招行保险顾问小李。已了解到您的咨询需求，请问有什么可以帮您？`;

      const humanMsg = {
        id: `human-${now}`,
        role: 'human-agent',
        type: 'text',
        content: welcomeContent,
        timestamp: now + 1,
        agentName: '保险顾问小李',
      };

      setTimeout(() => {
        setMessages(prev => [...prev, dividerMsg]);
        scrollToBottom();
      }, 500);

      setTimeout(() => {
        setMessages(prev => [...prev, humanMsg]);
        scrollToBottom();
      }, 1800);

      return;
    }
    // ==================== 投保意图流程 ====================
    if (intent === INTENTS.PURCHASE_INTENT) {
      setIsTyping(false);
      const now = Date.now();

      const productMatch = text.match(/[「"](.*?)[」"]/);
      const productName = productMatch ? productMatch[1] : null;

      const SAVINGS_CATEGORIES = ['endowment_life', 'annuity'];

      let matchedProduct = null;
      if (productName) {
        matchedProduct = productsData.products.find(p => p.name === productName || p.name.includes(productName));
      }

      if (!matchedProduct && !productName) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.type === 'recommendation' && msg.recommendationData?.plans?.length > 0) {
            const plan = msg.recommendationData.plans[0];
            matchedProduct = productsData.products.find(p => p.name === plan.productName || plan.productName.includes(p.name));
            break;
          }
          if (msg.type === 'text' && msg.role === 'assistant') {
            const mentionMatch = msg.content.match(/[「"](.*?)[」"]/);
            if (mentionMatch) {
              matchedProduct = productsData.products.find(p => p.name === mentionMatch[1] || p.name.includes(mentionMatch[1]));
              if (matchedProduct) break;
            }
          }
        }
      }

      const isSavings = matchedProduct && SAVINGS_CATEGORIES.includes(matchedProduct.category);
      const displayName = matchedProduct?.name || productName || '该产品';
      const categoryName = matchedProduct ? (productsData.categories[matchedProduct.category]?.name || '') : '';

      if (isSavings) {
        const tipMsg = {
          id: `ai-${now}`,
          role: 'assistant',
          type: 'text',
          content: `「${displayName}」属于${categoryName}，此类产品的投保需要由专业保险顾问为您提供一对一服务，包括：\n\n· 📊 详细收益演示与个性化方案设计\n· 📝 投保资料准备指导\n· 🔍 条款细节确认\n· ✍️ 双录（录音录像）合规流程\n\n正在为您转接专业顾问...`,
          timestamp: now,
        };

        setTimeout(() => {
          setMessages(prev => [...prev, tipMsg]);
          scrollToBottom();
        }, 300);

        const dividerMsg = {
          id: `divider-${now}`,
          type: 'transfer-divider',
          content: '正在为您转接专业保险顾问...',
          timestamp: now + 1,
        };

        setTimeout(() => {
          setMessages(prev => [...prev, dividerMsg]);
          scrollToBottom();
        }, 1200);

        const humanMsg = {
          id: `human-${now}`,
          role: 'human-agent',
          type: 'text',
          content: `您好，我是招行保险顾问小李。了解到您想投保「${displayName}」，这是一款不错的${categoryName}产品。\n\n接下来我会为您：\n1️⃣ 根据您的需求做详细的收益演示\n2️⃣ 协助完成投保资料准备\n3️⃣ 全程陪伴完成双录流程\n\n请问您方便提供一下缴费计划偏好吗？比如年缴金额和缴费年限。`,
          timestamp: now + 2,
          agentName: '保险顾问小李',
        };

        setTimeout(() => {
          setMessages(prev => [...prev, humanMsg]);
          scrollToBottom();
        }, 2500);

      } else {
        const tipMsg = {
          id: `ai-${now}`,
          role: 'assistant',
          type: 'text',
          content: matchedProduct
            ? `好的！「${displayName}」是一款优质的${categoryName}产品，已经为您生成投保链接 👇\n\n⚠️ **温馨提示**：\n· 投保前请仔细阅读产品条款、健康告知和免责条款\n· 如有健康异常情况，建议先使用智能核保功能\n· 投保过程中如有疑问，可随时咨询人工顾问`
            : `已为您准备投保入口 👇\n\n⚠️ **温馨提示**：投保前请仔细阅读产品条款和健康告知。`,
          timestamp: now,
        };

        const linkMsg = {
          id: `link-${now}`,
          type: 'purchase-link',
          content: '',
          purchaseData: {
            productName: displayName,
            insurer: matchedProduct?.insurer || '',
            category: categoryName,
            categoryIcon: matchedProduct ? (productsData.categories[matchedProduct.category]?.icon || '🛡️') : '🛡️',
            link: `https://insurance.cmbchina.com/product/${matchedProduct?.id || 'detail'}`,
            tags: matchedProduct?.tags || [],
          },
          timestamp: now + 1,
        };

        const quickMsg = {
          id: `quick-${now}`,
          role: 'assistant',
          type: 'quick-replies',
          content: '',
          options: [
            { text: '我有健康问题能投吗', icon: '❓' },
            { text: '转接人工顾问', icon: '👨‍💼' },
            { text: '继续看其他产品', icon: '🔄' }
          ],
          timestamp: now + 2,
        };

        setTimeout(() => {
          setMessages(prev => [...prev, tipMsg]);
          scrollToBottom();
        }, 300);

        setTimeout(() => {
          setMessages(prev => [...prev, linkMsg]);
          scrollToBottom();
        }, 800);

        setTimeout(() => {
          setMessages(prev => [...prev, quickMsg]);
          scrollToBottom();
        }, 1300);
      }

      return;
    }
    // ==================== 构建模块化 Prompt ====================
    const clarifyState = analyzeClarifyState(messages);
    const systemPrompt = buildModulePrompt(intent, channelMode, userProfile, findProfile, {
      forceRecommend,
      clarifyRounds: clarifyState.clarifyRounds,
    });

    // ==================== 创建 AI 消息占位 ====================
    const aiMsgId = `ai-${Date.now()}`;
    let thinkingText = '';
    let contentText = '';

    const showThinking = moduleConfig.enableThinking && moduleConfig.showThinkingByDefault;
    const enableThinkingAPI = moduleConfig.enableThinking;

    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      type: 'text',
      content: '',
      thinking: '',
      isStreaming: true,
      showThinkingByDefault: showThinking,
      _intent: intent,
      timestamp: Date.now()
    }]);
    setIsTyping(false);
    scrollToBottom();

    // ==================== 调用 AI（流式）====================
    callAIStream(apiConfig, systemPrompt, chatHistory, {
      onThinking: (chunk) => {
        if (!enableThinkingAPI) return;
        thinkingText += chunk;
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, thinking: thinkingText } : m
        ));
        scrollToBottom();
      },
      onContent: (chunk) => {
        contentText += chunk;
        const displayContent = contentText.replace(/```recommendation_json[\s\S]*$/, '').trim();
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: displayContent } : m
        ));
        scrollToBottom();
      },
      onDone: () => {
        const recMatch = contentText.match(/```recommendation_json\s*\n([\s\S]*?)\n```/);
        if (recMatch) {
          try {
            const recData = JSON.parse(recMatch[1]);
            if (recData.plans && recData.plans.length > 0) {
              const cleanContent = contentText.replace(/```recommendation_json\s*\n[\s\S]*?\n```/, '').trim();
              setMessages(prev => {
                const updated = prev.map(m =>
                  m.id === aiMsgId ? { ...m, isStreaming: false, content: cleanContent, _intent: intent } : m
                );
                updated.push({
                  id: `rec-${Date.now()}`,
                  role: 'assistant',
                  type: 'recommendation',
                  content: '',
                  recommendationData: recData,
                  _intent: intent,
                  timestamp: Date.now()
                });
                return updated;
              });
              scrollToBottom();
              return;
            }
          } catch (e) {
            console.warn('推荐数据解析失败:', e);
          }
        }

        if (intent === INTENTS.PRODUCT_RECOMMEND && !recMatch) {
          console.warn('[推荐模块] AI 未输出 recommendation_json，内容将以纯文本展示');
        }

        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, isStreaming: false, _intent: intent } : m
        ));
        scrollToBottom();
      },
      onError: (error) => {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId
            ? { ...m, isStreaming: false, content: `⚠️ 连接失败：${error.message}\n\n请检查API配置是否正确。当前为演示模式，你可以继续体验对话。` }
            : m
        ));
        scrollToBottom();
      }
    }, { enableThinking: enableThinkingAPI });
  }, [messages, apiConfig, channelMode, userProfile, findProfile, surveyCompleted, hasPromptedSurvey, scrollToBottom]);

  // 处理快捷回复点击
  const handleQuickReply = useCallback((text) => {
    handleSend(text);
  }, [handleSend]);

  // 处理保障卡片展示
  const handleShowProtection = useCallback(() => {
    setShowProtectionCard(prev => !prev);
  }, []);

  // 新建会话：清空对话历史，重置状态，重新发送欢迎消息（保留问卷数据）
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setFindProfile({
      F: { collected: channelMode === 'A', data: channelMode === 'A' ? userProfile.riskAssessment : {} },
      I: { collected: channelMode === 'A', data: channelMode === 'A' ? { incomeRange: userProfile.riskAssessment?.incomeRange } : {} },
      N: { collected: false, data: {} },
      D: { collected: false, data: {} }
    });
    setCurrentScene(null);
    setShowProtectionCard(false);
    setHasPromptedSurvey(false);

    // 重新生成欢迎消息
    const welcomeMessages = [];

    if (channelMode === 'A' && surveyCompleted) {
      welcomeMessages.push({
        id: `welcome-1-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        content: `你好！我是你的AI保险顾问小招 👋\n\n我看到你已经完成了风险评测，来帮你快速梳理一下：`,
        timestamp: Date.now()
      });
      welcomeMessages.push({
        id: `welcome-profile-${Date.now()}`,
        role: 'assistant',
        type: 'profile-summary',
        content: '',
        profileData: {
          gender: userProfile.gender,
          ageRange: userProfile.ageRange,
          ...userProfile.riskAssessment
        },
        timestamp: Date.now() + 100
      });
      welcomeMessages.push({
        id: `welcome-2-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        content: '基于你的画像，我可以直接给你做保障分析。请问今天想了解哪方面？',
        timestamp: Date.now() + 200
      });
      welcomeMessages.push({
        id: `welcome-quick-${Date.now()}`,
        role: 'assistant',
        type: 'quick-replies',
        content: '',
        options: [
          { text: '帮我做保障规划', icon: '🛡️' },
          { text: '想了解增额终身寿', icon: '💰' },
          { text: '给孩子买保险', icon: '👶' },
          { text: '帮我看看保障够不够', icon: '🔍' }
        ],
        timestamp: Date.now() + 300
      });
    } else {
      welcomeMessages.push({
        id: `welcome-1-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        content: `你好！我是你的AI保险顾问小招 👋\n\n我可以帮你分析保障需求、推荐适合的保险产品。有什么想了解的，尽管和我聊~`,
        timestamp: Date.now()
      });
      welcomeMessages.push({
        id: `welcome-quick-${Date.now()}`,
        role: 'assistant',
        type: 'quick-replies',
        content: '',
        options: [
          { text: '帮我从0开始规划保障', icon: '🛡️' },
          { text: '最近想了解增额终身寿', icon: '💰' },
          { text: '想给全家做保障方案', icon: '👨‍👩‍👧' },
          { text: '就随便看看', icon: '👀' }
        ],
        timestamp: Date.now() + 100
      });
    }

    welcomeMessages.forEach((msg, index) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }, index * 600);
    });
  }, [channelMode, userProfile, surveyCompleted, scrollToBottom]);

  // 处理推荐产品卡片的交互
  const handleProductClick = useCallback((product, action) => {
    if (action === 'detail') {
      handleSend(`想了解「${product.productName}」的详细信息`);
    } else if (action === 'purchase') {
      handleSend(`想投保「${product.productName}」`, 'PURCHASE_INTENT');
    } else if (action === 'consult') {
      handleSend(`想就「${product.productName}」咨询人工顾问`, 'TRANSFER_HUMAN');
    }
  }, [handleSend]);

  // 处理问卷入口卡片点击
  const handleSurveyInviteClick = useCallback(() => {
    onOpenSurvey();
  }, [onOpenSurvey]);

  return (
    <div className="chat-screen">
      {/* 顶部导航 */}
      <NavBar
        channelMode={channelMode}
        onOpenSettings={onOpenSettings}
        onShowProtection={handleShowProtection}
        onNewChat={handleNewChat}
        onOpenSurvey={onOpenSurvey}
        surveyCompleted={surveyCompleted}
      />

      {/* 保障情况卡片（可收起） */}
      {showProtectionCard && (
        <ProtectionCard userProfile={userProfile} channelMode={channelMode} />
      )}

      {/* 消息列表 */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        onQuickReply={handleQuickReply}
        onProductClick={handleProductClick}
        messagesEndRef={messagesEndRef}
      />

      {/* 未完成问卷时的提示入口 - 在首次回复后展示 */}
      {!surveyCompleted && hasPromptedSurvey && (
        <div className="survey-invite-bar">
          <div className="survey-invite-card" onClick={handleSurveyInviteClick}>
            <div className="survey-invite-title">📋 完成风险评测，获取精准推荐</div>
            <div className="survey-invite-desc">填写评测问卷后可为您精准匹配保险产品，否则只能提供普适性建议</div>
          </div>
        </div>
      )}

      {/* 底部输入栏 */}
      <InputBar onSend={handleSend} isTyping={isTyping} />
    </div>
  );
}

/**
 * 模拟AI响应 — 当未配置API时使用
 */
function generateMockResponse(userText, channelMode, userProfile, findProfile) {
  const text = userText.toLowerCase();
  const responses = [];
  const now = Date.now();

  // 问卷未完成时的提示前缀
  const surveyPrefix = channelMode === 'B' && !userProfile.riskAssessment
    ? `💡 **温馨提示**：建议您先完成右上角的「风险评测」问卷，我可以基于您的画像给出更精准的推荐。目前只能提供普适性建议。\n\n`
    : '';

  if (text.includes('保障规划') || text.includes('从0开始') || text.includes('从零开始')) {
    if (channelMode === 'A') {
      responses.push({
        id: `ai-${now}`,
        role: 'assistant',
        type: 'text',
        content: `${surveyPrefix}好的，来帮你做保障规划！根据你的评测信息，我来分析一下：\n\n📊 **你的基本情况**\n· ${userProfile.ageRange || '未知年龄'}${userProfile.gender || ''}性\n· 家庭年收入${userProfile.riskAssessment?.incomeRange || '未知'}\n· 家庭人数${userProfile.riskAssessment?.familySize || '未知'}\n\n🔍 **初步保障分析**\n作为家庭的重要经济来源之一，你最需要优先配置的是：\n\n1️⃣ **重疾险** — 保额建议60-100万（覆盖3-5年家庭收入）\n2️⃣ **百万医疗险** — 住院费用报销，大病治疗更安心\n3️⃣ **定期寿险** — 保障家庭经济安全，保到孩子经济独立`,
        timestamp: now
      });
    } else {
      responses.push({
        id: `ai-${now}`,
        role: 'assistant',
        type: 'text',
        content: `${surveyPrefix}好的！保障规划是非常重要的一步 👍\n\n为了给你更精准的建议，我想先了解一下基本情况：\n\n你是给自己规划还是给全家人？家里大概是什么情况？\n\n当然，如果不方便说太细也没关系，我可以先给一个通用方案。`,
        timestamp: now
      });
    }
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '给自己规划', icon: '👤' },
        { text: '给全家规划', icon: '👨‍👩‍👧' },
        { text: '先看通用方案', icon: '📋' }
      ],
      timestamp: now + 100
    });
  } else if (text.includes('增额终身寿') || text.includes('储蓄') || text.includes('利率')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `${surveyPrefix}在利率持续下行的环境下，增额终身寿确实是很多人关注的选择——可以锁定一个长期的预定利率 📈\n\n**增额终身寿的核心特点**：\n· 保额按约定利率逐年递增\n· 可通过减保灵活取用现金价值\n· 目前预定利率多在2.5%-3.0%之间\n\n想帮你对比几款产品的话，我想确认一下：\n\n**这笔钱大概打算什么时候用？**`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '5年以上不急用', icon: '⏰' },
        { text: '想做养老储备', icon: '👴' },
        { text: '给孩子存教育金', icon: '🎓' },
        { text: '先看看收益演示', icon: '📊' }
      ],
      timestamp: now + 100
    });
  } else if (text.includes('孩子') || text.includes('小孩') || text.includes('宝宝') || text.includes('给娃')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `${surveyPrefix}给孩子的保障很重要！不过在这之前，有一个重要的理念想先和你分享：\n\n💡 **大人是孩子最大的保障**\n\n如果大人的保障还没有配齐，建议优先补上——万一大人出状况，孩子的保障反而没有了经济支撑。\n\n话说回来，少儿保险的性价比确实非常高——\n· **少儿重疾险**：保额可以做到50-80万，杠杆率很高\n· **少儿医疗险**：住院费基本全报，非常实用\n\n请问宝宝多大了？我来给你推荐合适的方案。`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '孩子3岁', icon: '👶' },
        { text: '孩子刚出生', icon: '🍼' },
        { text: '我自己的保障也没配', icon: '🤔' },
        { text: '全家一起规划', icon: '👨‍👩‍👧' }
      ],
      timestamp: now + 100
    });
  } else if (text.includes('随便看看') || text.includes('看看')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `${surveyPrefix}没问题！先给你看看同龄人最关注的保障方向 👇\n\n根据你的年龄段，大家最常配置的是：\n\n🛡️ **健康保障** — 重疾险+百万医疗险\n❤️ **家庭保障** — 定期寿险\n💰 **储蓄理财** — 增额终身寿\n\n你对哪个方向比较感兴趣？我可以展开详细聊聊。`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '先聊健康保障', icon: '🛡️' },
        { text: '了解储蓄理财', icon: '💰' },
        { text: '帮我做完整规划', icon: '📋' },
        { text: '有具体产品想问', icon: '❓' }
      ],
      timestamp: now + 100
    });
  } else if (text.includes('给自己') || text.includes('给全家') || text.includes('全家一起')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'protection-card',
      content: '',
      protectionData: {
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
      },
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 200}`,
      role: 'assistant',
      type: 'suggestion-card',
      content: '',
      suggestions: [
        {
          title: '重点关注健康保障，优先配置医疗险',
          desc: '成年人工作压力大，健康风险增加，医疗险可报销大病医疗费用，减轻经济负担'
        }
      ],
      timestamp: now + 200
    });
    responses.push({
      id: `ai-${now + 400}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '帮我挑选一个医疗险' },
        { text: '什么是三张保单' }
      ],
      timestamp: now + 400
    });
  } else if (text.includes('5年') || text.includes('不急用') || text.includes('收益演示') || text.includes('先看看')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `好的！帮你对比几款热门增额终身寿险的核心特点 📊`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'product-comparison',
      content: '',
      comparisonData: {
        scenario: '增额终身寿核心指标对比',
        products: [
          {
            name: '招商信诺·传世金彩',
            irr: '2.48%',
            breakeven: '第7年',
            cv_10y: '较高',
            cv_20y: '较高',
            cv_30y: '较高',
            highlight: '招行系产品，减保灵活'
          },
          {
            name: '弘康·利多多3号',
            irr: '2.50%',
            breakeven: '第6年',
            cv_10y: '较高',
            cv_20y: '较高',
            cv_30y: '较高',
            highlight: 'IRR表现优秀'
          },
          {
            name: '中英·臻享传家',
            irr: '2.47%',
            breakeven: '第7年',
            cv_10y: '较高',
            cv_20y: '较高',
            cv_30y: '较高',
            highlight: '保司偿付能力强'
          }
        ]
      },
      timestamp: now + 100
    });
    responses.push({
      id: `ai-${now + 300}`,
      role: 'assistant',
      type: 'text',
      content: `⚠️ **温馨提示**：\n· 以上收益基于确定利益（预定利率）演示，分红部分（如有）不保证\n· 增额终身寿前期退保会有损失，建议确认这笔资金短期不急用\n· 保险产品不同于银行存款/理财，请根据自身需求选择\n\n想详细了解哪一款？我可以展开讲解保障条款。`,
      timestamp: now + 300
    });
  } else if (text.includes('重疾')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `${surveyPrefix}重疾险是保障体系中最核心的一环 🛡️\n\n**它的价值**：确诊合同约定的重大疾病（如癌症、心梗等），一次性赔你一笔钱——这笔钱不限用途，可以治病，也可以弥补治疗期间的收入损失。\n\n**保额怎么定？**\n建议覆盖3-5年的家庭年收入。\n\n帮你推荐几款产品看看？`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '看看推荐产品', icon: '📋' },
        { text: '保额怎么选', icon: '💡' },
        { text: '我有甲状腺结节能买吗', icon: '❓' },
        { text: '重疾+医疗怎么搭配', icon: '🔗' }
      ],
      timestamp: now + 100
    });
  } else if (text.includes('产品') || text.includes('推荐') || text.includes('看看')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `${surveyPrefix}根据你的情况，我为你筛选了以下保障方案 👇`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'recommendation',
      content: '',
      recommendationData: {
        plans: [
          {
            planLabel: '重疾保障',
            productName: '招惠保·福享康健2025',
            highlights: ['60岁前额外赔80%', '重疾不分组多次赔', '保障全面'],
            coverageItems: [
              '重大疾病保障：确诊即赔保额50万',
              '中症保障：赔付2次，每次50%保额',
              '轻症保障：赔付3次，每次30%保额',
              '60岁前额外赔付80%基本保额',
              '被保人豁免：确诊中/轻症后续保费免交'
            ],
            reason: '作为家庭经济支柱，重疾险是首要配置。该产品保障全面，且60岁前额外赔付80%保额，在收入高峰期提供更强保障力度。'
          },
          {
            planLabel: '医疗保障',
            productName: 'e生保·长期医疗2025',
            highlights: ['保证续保20年', '400万保额', '外购药可报'],
            coverageItems: [
              '一般住院医疗：400万保额，1万免赔',
              '重疾住院：400万保额，0免赔',
              '质子重离子治疗：100%报销',
              '院外特药保障：覆盖多种靶向药',
              '住院前后门急诊：前7天后30天'
            ],
            reason: '百万医疗险是重疾险的有力补充，解决"治疗费用"问题。该产品保证续保20年，不用担心停售风险。'
          },
          {
            planLabel: '寿险保障',
            productName: '定海柱·定期寿险2025',
            highlights: ['高性价比', '免体检额度高', '灵活可选'],
            coverageItems: [
              '身故/全残保障：赔付基本保额100万',
              '可选航空意外额外赔付',
              '可选水陆公共交通意外额外赔付',
              '免体检最高可投保300万'
            ],
            reason: '定期寿险保障家庭经济安全，万一不幸身故或全残，保额可覆盖房贷和家庭5年支出。'
          }
        ]
      },
      timestamp: now + 100
    });
    responses.push({
      id: `ai-${now + 200}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '看条款细节', icon: '📄' },
        { text: '还有其他产品吗', icon: '🔄' },
        { text: '对方案有疑问', icon: '❓' }
      ],
      timestamp: now + 200
    });
  } else if (text.includes('结节') || text.includes('能买吗') || text.includes('健告')) {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `关于甲状腺结节的投保问题：\n\n⚠️ **重要说明**：能否投保需要以具体产品的健康告知和核保结论为准——我作为AI顾问不做核保判断。\n\n不过我可以给你一些参考信息：\n\n· 甲状腺结节是非常常见的体检发现（约20-30%的人群有）\n· **关键看结节分级**：TI-RADS 1-3级通常核保较友好\n· 部分产品支持**智能核保**——线上提交体检报告，即时出结论\n\n**建议**：如果核保结果不理想，也可以转接我们的专业保险顾问。`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '了解智能核保流程', icon: '📋' },
        { text: '转接人工顾问', icon: '👨‍💼' },
        { text: '先看其他产品', icon: '🔄' }
      ],
      timestamp: now + 100
    });
  } else {
    responses.push({
      id: `ai-${now}`,
      role: 'assistant',
      type: 'text',
      content: `${surveyPrefix}收到！让我想想怎么帮到你...\n\n你说的"${userText}"，我理解你可能想了解保险相关的内容。我可以帮你：\n\n· 🛡️ 做保障需求分析和规划\n· 📊 对比不同保险产品\n· 📄 解读产品条款\n· ❓ 回答保险相关的疑问\n\n想从哪个方向开始？`,
      timestamp: now
    });
    responses.push({
      id: `ai-${now + 100}`,
      role: 'assistant',
      type: 'quick-replies',
      content: '',
      options: [
        { text: '做保障规划', icon: '🛡️' },
        { text: '产品推荐', icon: '📊' },
        { text: '条款解读', icon: '📄' }
      ],
      timestamp: now + 100
    });
  }

  return responses;
}

export default ChatScreen;
