/**
 * intentRouter.js — 意图识别与功能路由
 * 
 * 设计思路：
 * 1. 先用规则匹配做快速分类（零延迟）
 * 2. 规则无法覆盖时，用轻量AI调用做意图分类（非流式，快速返回）
 * 3. 每个意图对应一个功能模块，有独立的 prompt 和约束
 * 
 * 功能模块：
 * - PRODUCT_RECOMMEND: 产品推荐（核心模块）
 * - NEEDS_CLARIFY: 需求澄清（信息不足时的短对话）
 * - PRODUCT_DETAIL: 产品详情/条款解读
 * - PRODUCT_COMPARE: 产品对比
 * - HEALTH_CONSULT: 健康告知咨询
 * - KNOWLEDGE_QA: 保险知识问答
 * - CHITCHAT: 闲聊/兜底
 */

import { callAI } from './apiClient';

// ==================== 意图定义 ====================

export const INTENTS = {
  PRODUCT_RECOMMEND: 'PRODUCT_RECOMMEND',   // 产品推荐
  NEEDS_CLARIFY: 'NEEDS_CLARIFY',           // 需求澄清（信息不足）
  PRODUCT_DETAIL: 'PRODUCT_DETAIL',         // 产品详情/条款解读
  PRODUCT_COMPARE: 'PRODUCT_COMPARE',       // 产品对比
  HEALTH_CONSULT: 'HEALTH_CONSULT',         // 健康告知咨询
  KNOWLEDGE_QA: 'KNOWLEDGE_QA',             // 保险知识问答
  CHITCHAT: 'CHITCHAT',                     // 闲聊/兜底
  TRANSFER_HUMAN: 'TRANSFER_HUMAN',         // 转人工顾问
  PURCHASE_INTENT: 'PURCHASE_INTENT',       // 确定投保意图
};

// ==================== 功能模块配置 ====================

export const MODULE_CONFIG = {
  [INTENTS.PRODUCT_RECOMMEND]: {
    enableThinking: true,       // 开启CoT思维链（API层 thinking参数）
    showThinkingByDefault: true, // 前端默认展开思维链
    mustOutputCard: true,       // 必须输出推荐卡片
    maxTokens: 4096,
  },
  [INTENTS.NEEDS_CLARIFY]: {
    enableThinking: false,      // 需求澄清不需要CoT
    showThinkingByDefault: false,
    mustOutputCard: false,
    maxTokens: 1024,
    maxRounds: 2,               // 最多2轮澄清
  },
  [INTENTS.PRODUCT_DETAIL]: {
    enableThinking: true,       // 产品详情需要CoT做条款推理
    showThinkingByDefault: true,
    mustOutputCard: false,
    maxTokens: 4096,
  },
  [INTENTS.PRODUCT_COMPARE]: {
    enableThinking: true,       // 产品对比需要CoT做多维度分析
    showThinkingByDefault: true,
    mustOutputCard: false,       // 对比用专门的表格组件
    maxTokens: 4096,
  },
  [INTENTS.HEALTH_CONSULT]: {
    enableThinking: false,       // 健康咨询不需要CoT
    showThinkingByDefault: false,
    mustOutputCard: false,
    maxTokens: 2048,
  },
  [INTENTS.KNOWLEDGE_QA]: {
    enableThinking: false,       // 知识问答不需要CoT
    showThinkingByDefault: false,
    mustOutputCard: false,
    maxTokens: 2048,
  },
  [INTENTS.CHITCHAT]: {
    enableThinking: false,       // 闲聊不需要CoT
    showThinkingByDefault: false,
    mustOutputCard: false,
    maxTokens: 1024,
  },
  [INTENTS.TRANSFER_HUMAN]: {
    enableThinking: false,       // 转人工不需要CoT
    showThinkingByDefault: false,
    mustOutputCard: false,
    maxTokens: 0,                // 不调用AI
    isLocalOnly: true,           // 纯前端处理，不调用API
  },
  [INTENTS.PURCHASE_INTENT]: {
    enableThinking: false,       // 投保意图不需要CoT
    showThinkingByDefault: false,
    mustOutputCard: false,
    maxTokens: 0,                // 不调用AI
    isLocalOnly: true,           // 纯前端处理
  },
};

// ==================== 规则匹配引擎 ====================

/**
 * 基于规则的快速意图识别
 * @returns {string|null} 识别到的意图，null 表示需要 AI 判断
 */
function matchByRules(userText, chatContext) {
  const text = userText.toLowerCase();

  // ---- 产品详情 ----
  // 用户明确提到某个产品名并想了解详情
  const detailPatterns = [
    /详细信息/, /详情/, /条款/, /保什么/, /保障范围/,
    /想了解「.*」/, /想了解".*"/, /具体.*保障/, /这个产品/,
    /怎么赔/, /怎么报销/, /理赔.*规则/
  ];
  if (detailPatterns.some(p => p.test(text))) {
    return INTENTS.PRODUCT_DETAIL;
  }

  // ---- 产品对比 ----
  const comparePatterns = [
    /对比/, /比较/, /哪个好/, /哪个更/, /区别/, /差别/,
    /和.*比/, /跟.*比/, /vs/
  ];
  if (comparePatterns.some(p => p.test(text))) {
    return INTENTS.PRODUCT_COMPARE;
  }

  // ---- 健康告知 ----
  const healthPatterns = [
    /结节/, /能买吗/, /健告/, /健康告知/, /体检/, /异常/,
    /带病/, /核保/, /既往症/, /拒保/, /加费/, /除外/,
    /甲状腺/, /高血压/, /糖尿病/, /乙肝/, /肝功能/
  ];
  if (healthPatterns.some(p => p.test(text))) {
    return INTENTS.HEALTH_CONSULT;
  }

  // ---- 保险知识问答 ----
  const knowledgePatterns = [
    /什么是.*险/, /.*险是什么/, /什么叫/, /解释一下/,
    /怎么理解/, /区别是什么/, /有什么用/, /什么意思/,
    /免赔额/, /等待期/, /犹豫期/, /宽限期/, /保额/,
    /保费.*豁免/, /豁免/, /怎么选/, /挑选/
  ];
  if (knowledgePatterns.some(p => p.test(text))) {
    return INTENTS.KNOWLEDGE_QA;
  }

  // ---- 产品推荐（明确意图）----
  const recommendPatterns = [
    /推荐/, /看看产品/, /看看方案/, /帮我配/, /帮我选/,
    /规划/, /从0开始/, /从零开始/, /全家.*保障/,
    /给.*买保险/, /给.*投保/,
    /增额终身寿/, /重疾险/, /医疗险/, /意外险/, /定期寿/,
    /储蓄/, /理财/, /养老/, /教育金/,
    /保障够不够/, /查漏补缺/, /先看通用方案/, /大众推荐/,
  ];
  if (recommendPatterns.some(p => p.test(text))) {
    // 判断信息是否足够进入推荐，还是需要先澄清
    return null; // 让 AI 判断是推荐还是澄清
  }

  // ---- 投保意图 ----
  const purchasePatterns = [
    /想.*投保/, /要.*投保/, /确定.*投保/, /准备.*投保/, /打算.*投保/,
    /怎么买/, /怎么投保/, /如何购买/, /如何投保/,
    /我要买/, /想买这个/, /就买这个/, /就这个了/, /决定买/,
    /下单/, /购买/, /投保.*链接/, /投保.*入口/,
    /想买「.*」/, /要买「.*」/, /投保「.*」/,
    /在哪.*买/, /在哪.*投保/, /去哪.*买/, /去哪.*投保/
  ];
  if (purchasePatterns.some(p => p.test(text))) {
    return INTENTS.PURCHASE_INTENT;
  }

  // ---- 转人工 ----
  const transferPatterns = [
    /转.*人工/, /咨询顾问/, /转.*顾问/, /人工.*服务/, /人工.*客服/,
    /找.*顾问/, /真人/, /转接/
  ];
  if (transferPatterns.some(p => p.test(text))) {
    return INTENTS.TRANSFER_HUMAN;
  }

  // ---- 闲聊/随便看看 ----
  const chitchatPatterns = [
    /^(你好|hi|hello|嗨|hey)/,
    /谢谢/, /好的/, /知道了/, /明白了/, /嗯嗯/,
    /^(哦|噢|好|行|可以|ok|没问题)$/,
  ];
  if (chitchatPatterns.some(p => p.test(text))) {
    return INTENTS.CHITCHAT;
  }

  // 规则无法确定 → 交给 AI
  return null;
}

// ==================== AI 意图分类 ====================

const INTENT_CLASSIFICATION_PROMPT = `你是一个意图分类器。根据用户输入和对话上下文，判断用户当前意图属于以下哪一类：

1. PRODUCT_RECOMMEND — 用户希望获得产品推荐或保障方案（包括：想买保险、做规划、看方案、了解某类险种等）
2. NEEDS_CLARIFY — 用户在回复AI的信息采集追问（如回答家庭情况、预算、需求偏好等），且当前信息仍不足以做出精准推荐
3. PRODUCT_DETAIL — 用户想了解某个具体产品的详情、条款、保障范围
4. PRODUCT_COMPARE — 用户想对比多个产品
5. HEALTH_CONSULT — 用户有健康问题，想了解是否影响投保
6. KNOWLEDGE_QA — 用户在问保险知识（概念、术语、原理）
7. CHITCHAT — 闲聊、打招呼、感谢、确认等非业务对话
8. TRANSFER_HUMAN — 用户明确要求转人工、找顾问、要真人服务

重要规则：
- 当用户回复了AI的追问（补充了家庭、预算、需求等信息），如果已有足够信息做推荐（至少有需求意图+年龄性别），应判断为 PRODUCT_RECOMMEND
- 如果用户表达了保险需求（哪怕很模糊，如"随便看看""想了解"），都应判断为 PRODUCT_RECOMMEND
- NEEDS_CLARIFY 只在用户回复内容含糊、无法判断需求方向时使用
- 只有用户在问一个纯知识概念时才用 KNOWLEDGE_QA
- 当用户说"转人工""找顾问""要真人服务""咨询顾问"时，必须判断为 TRANSFER_HUMAN

只输出意图标签，不要输出其他内容。`;

/**
 * 用 AI 进行意图分类（非流式，快速返回）
 */
async function classifyByAI(apiConfig, userText, chatHistory, userContext) {
  const classificationMessages = [
    {
      role: 'user',
      content: `对话上下文：
${chatHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

用户信息：${userContext}

当前用户输入：${userText}

请判断意图类别：`
    }
  ];

  try {
    const result = await callAI(
      apiConfig,
      INTENT_CLASSIFICATION_PROMPT,
      classificationMessages
    );
    
    const intent = result.trim().replace(/[^A-Z_]/g, '');
    if (INTENTS[intent]) {
      return intent;
    }
    // AI 返回了无法识别的意图，默认推荐
    return INTENTS.PRODUCT_RECOMMEND;
  } catch (e) {
    console.warn('AI 意图分类失败，使用默认:', e);
    return INTENTS.PRODUCT_RECOMMEND;
  }
}

// ==================== 会话状态跟踪 ====================

/**
 * 分析对话上下文，判断当前是否处于需求澄清阶段以及澄清轮次
 */
export function analyzeClarifyState(messages) {
  let clarifyRounds = 0;
  
  // 从最后的消息往前看，统计连续的澄清轮次
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg._intent === INTENTS.NEEDS_CLARIFY) {
      clarifyRounds++;
    } else if (msg.role === 'assistant' && msg._intent && msg._intent !== INTENTS.NEEDS_CLARIFY) {
      break; // 遇到非澄清意图的AI回复，停止计数
    }
  }

  return {
    clarifyRounds,
    shouldForceRecommend: clarifyRounds >= 2, // 已经澄清2轮，必须给推荐
  };
}

// ==================== 主路由函数 ====================

/**
 * 意图识别主函数
 * @param {string} userText - 用户输入
 * @param {Object} apiConfig - API配置
 * @param {Array} chatHistory - 对话历史
 * @param {Object} context - 上下文 { channelMode, userProfile, findProfile, messages }
 * @returns {Promise<{intent: string, moduleConfig: Object}>}
 */
export async function routeIntent(userText, apiConfig, chatHistory, context) {
  const { messages, channelMode, userProfile } = context;
  
  // 第一步：检查澄清状态
  const clarifyState = analyzeClarifyState(messages);
  if (clarifyState.shouldForceRecommend) {
    // 已澄清2轮，强制进入推荐
    return {
      intent: INTENTS.PRODUCT_RECOMMEND,
      moduleConfig: MODULE_CONFIG[INTENTS.PRODUCT_RECOMMEND],
      forceRecommend: true,
    };
  }

  // 第二步：规则匹配
  const ruleIntent = matchByRules(userText, { messages, channelMode });
  if (ruleIntent) {
    return {
      intent: ruleIntent,
      moduleConfig: MODULE_CONFIG[ruleIntent],
      forceRecommend: false,
    };
  }

  // 第三步：如果没有API配置，使用简单启发式
  if (!apiConfig.baseUrl || !apiConfig.apiKey) {
    // 无API时的简单分类
    const text = userText.toLowerCase();
    if (text.length < 5 && !/险|保|买|推|看|选/.test(text)) {
      return {
        intent: INTENTS.CHITCHAT,
        moduleConfig: MODULE_CONFIG[INTENTS.CHITCHAT],
        forceRecommend: false,
      };
    }
    // 默认进入推荐
    return {
      intent: INTENTS.PRODUCT_RECOMMEND,
      moduleConfig: MODULE_CONFIG[INTENTS.PRODUCT_RECOMMEND],
      forceRecommend: false,
    };
  }

  // 第四步：AI 意图分类
  const userContext = `${userProfile.gender || '未知'}，${userProfile.ageRange || '未知年龄'}，通道${channelMode}`;
  const aiIntent = await classifyByAI(apiConfig, userText, chatHistory, userContext);

  // 第五步：如果AI判断为澄清，但通道A已有完整信息，升级为推荐
  if (aiIntent === INTENTS.NEEDS_CLARIFY && channelMode === 'A') {
    return {
      intent: INTENTS.PRODUCT_RECOMMEND,
      moduleConfig: MODULE_CONFIG[INTENTS.PRODUCT_RECOMMEND],
      forceRecommend: false,
    };
  }

  return {
    intent: aiIntent,
    moduleConfig: MODULE_CONFIG[aiIntent],
    forceRecommend: false,
  };
}
