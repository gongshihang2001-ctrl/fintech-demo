import React, { useState } from 'react';
import '../styles/survey.css';

/**
 * RiskSurveyModal — 风险评测问卷弹窗
 * 分步表单，8题8页
 */

const SURVEY_QUESTIONS = [
  {
    id: 'gender',
    title: '您的性别是？',
    dimension: 'F维度：基础画像',
    options: [
      { value: '男', label: '男' },
      { value: '女', label: '女' },
    ]
  },
  {
    id: 'ageRange',
    title: '您的年龄段是？',
    dimension: 'F维度：基础画像，影响产品可选范围与费率',
    options: [
      { value: '18-25岁', label: '18-25岁' },
      { value: '26-35岁', label: '26-35岁' },
      { value: '36-45岁', label: '36-45岁' },
      { value: '46-55岁', label: '46-55岁' },
      { value: '56-65岁', label: '56-65岁' },
      { value: '65岁以上', label: '65岁以上' },
    ]
  },
  {
    id: 'familySize',
    title: '您的家庭人数是？',
    dimension: 'F维度：家庭规模',
    options: [
      { value: '1人（独居）', label: '1人（独居）' },
      { value: '2人', label: '2人' },
      { value: '3人', label: '3人' },
      { value: '4人', label: '4人' },
      { value: '5人及以上', label: '5人及以上' },
    ]
  },
  {
    id: 'incomeRange',
    title: '您的家庭年收入范围是？',
    dimension: 'I维度：收入',
    options: [
      { value: '10万以下', label: '10万以下' },
      { value: '10-30万', label: '10-30万' },
      { value: '30-50万', label: '30-50万' },
      { value: '50-100万', label: '50-100万' },
      { value: '100万以上', label: '100万以上' },
    ]
  },
  {
    id: 'debt',
    title: '您目前是否有房贷、车贷等负债？',
    dimension: 'I维度：负债，寿险保额关键输入',
    options: [
      { value: '无负债', label: '无负债' },
      { value: '有负债，余额50万以内', label: '有负债，余额50万以内' },
      { value: '有负债，余额50-150万', label: '有负债，余额50-150万' },
      { value: '有负债，余额150-300万', label: '有负债，余额150-300万' },
      { value: '有负债，余额300万以上', label: '有负债，余额300万以上' },
    ]
  },
  {
    id: 'incomeStability',
    title: '您的收入稳定性如何？',
    dimension: 'I维度：经济抗风险能力',
    options: [
      { value: '非常稳定（体制内/国企等）', label: '非常稳定（体制内/国企等）' },
      { value: '比较稳定（大企业/正式合同）', label: '比较稳定（大企业/正式合同）' },
      { value: '一般（中小民企）', label: '一般（中小民企）' },
      { value: '不太稳定（自由职业/个体经营）', label: '不太稳定（自由职业/个体经营）' },
      { value: '很不稳定（季节性/临时性收入）', label: '很不稳定（季节性/临时性收入）' },
    ]
  },
  {
    id: 'insuranceKnowledge',
    title: '您对金融保险产品的了解程度？',
    dimension: '对话策略适配：专业度分层',
    options: [
      { value: '完全不了解', label: '完全不了解' },
      { value: '了解一点，买过简单产品', label: '了解一点，买过简单产品' },
      { value: '有一定经验，买过多种产品', label: '有一定经验，买过多种产品' },
      { value: '比较熟悉，经常研究', label: '比较熟悉，经常研究' },
      { value: '非常专业，从事相关行业', label: '非常专业，从事相关行业' },
    ]
  },
  {
    id: 'topConcern',
    title: '您目前最关注的问题是？',
    dimension: 'N维度：需求意图初步锚定',
    options: [
      { value: '大病带来的高额医疗费', label: '大病带来的高额医疗费' },
      { value: '意外导致收入中断，家人生活受影响', label: '意外导致收入中断，家人生活受影响' },
      { value: '养老金不够，晚年生活质量无保障', label: '养老金不够，晚年生活质量无保障' },
      { value: '现有资产缩水或投资亏损', label: '现有资产缩水或投资亏损' },
      { value: '还没想好，想先全面了解一下', label: '还没想好，想先全面了解一下' },
    ]
  },
];

function RiskSurveyModal({ onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQ = SURVEY_QUESTIONS[currentStep];
  const totalSteps = SURVEY_QUESTIONS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;
  const hasAnswer = answers[currentQ.id] !== undefined && answers[currentQ.id] !== '';

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
  };

  const handleNext = () => {
    if (!hasAnswer) return;
    if (isLastStep) {
      // 完成问卷，构建 userProfile
      const userProfile = {
        gender: answers.gender || '',
        ageRange: answers.ageRange || '',
        riskAssessment: {
          familySize: answers.familySize || '',
          incomeRange: answers.incomeRange || '',
          debt: answers.debt || '',
          incomeStability: answers.incomeStability || '',
          insuranceKnowledge: answers.insuranceKnowledge || '',
          topConcern: answers.topConcern || '',
        }
      };
      onComplete(userProfile);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="survey-overlay" onClick={onClose}>
      <div className="survey-modal" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="survey-header">
          <span className="survey-title">📋 风险评测</span>
          <button className="survey-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 进度条 */}
        <div className="survey-progress-bar">
          <div className="survey-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="survey-progress-text">{currentStep + 1} / {totalSteps}</div>

        {/* 题目区域 */}
        <div className="survey-body">
          <div className="survey-dimension">{currentQ.dimension}</div>
          <div className="survey-question">{currentQ.title}</div>

          <div className="survey-options">
            {currentQ.options.map((opt) => (
              <button
                key={opt.value}
                className={`survey-option ${answers[currentQ.id] === opt.value ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="survey-option-radio">
                  <span className="survey-option-radio-inner" />
                </span>
                <span className="survey-option-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="survey-footer">
          {currentStep > 0 && (
            <button className="survey-btn survey-btn-prev" onClick={handlePrev}>
              上一步
            </button>
          )}
          <button
            className={`survey-btn survey-btn-next ${hasAnswer ? 'active' : 'disabled'}`}
            onClick={handleNext}
            disabled={!hasAnswer}
          >
            {isLastStep ? '完成评测' : '下一题'}
            {!isLastStep && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiskSurveyModal;
