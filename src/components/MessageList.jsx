import React from 'react';
import MessageBubble from './MessageBubble';
import ProtectionCard from './ProtectionCard';
import SuggestionCard from './SuggestionCard';
import QuickReplies from './QuickReplies';
import ProductComparison from './ProductComparison';
import ProfileSummary from './ProfileSummary';
import RecommendationCard from './RecommendationCard';
import TypingIndicator from './TypingIndicator';
import TransferDivider from './TransferDivider';
import PurchaseLink from './PurchaseLink';
import '../styles/messages.css';

/**
 * MessageList — 消息列表容器
 */
function MessageList({ messages, isTyping, onQuickReply, onProductClick, messagesEndRef }) {
  return (
    <div className="message-list">
      <div className="message-list-inner">
        {messages.map((msg) => {
          switch (msg.type) {
            case 'text':
              return <MessageBubble key={msg.id} message={msg} />;
            case 'quick-replies':
              return <QuickReplies key={msg.id} options={msg.options} onSelect={onQuickReply} />;
            case 'protection-card':
              return <ProtectionCard key={msg.id} data={msg.protectionData} inline />;
            case 'suggestion-card':
              return <SuggestionCard key={msg.id} suggestions={msg.suggestions} />;
            case 'product-comparison':
              return <ProductComparison key={msg.id} data={msg.comparisonData} />;
            case 'profile-summary':
              return <ProfileSummary key={msg.id} data={msg.profileData} />;
            case 'recommendation':
              return <RecommendationCard key={msg.id} data={msg.recommendationData} onProductClick={onProductClick} />;
            case 'transfer-divider':
              return <TransferDivider key={msg.id} message={msg} />;
            case 'purchase-link':
              return <PurchaseLink key={msg.id} data={msg.purchaseData} />;
            default:
              return <MessageBubble key={msg.id} message={msg} />;
          }
        })}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>
    </div>
  );
}

export default MessageList;
