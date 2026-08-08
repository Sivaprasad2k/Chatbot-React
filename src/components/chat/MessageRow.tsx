import React from 'react';
import { Volume2, VolumeX, FileText } from 'lucide-react';
import { Message } from '@/types/chat';
import { CodeBlock } from './CodeBlock';
import { AvisLogo } from '@/components/common/AvisLogo';

interface MessageRowProps {
  message: Message;
  speakingMsgId: string | null;
  onSpeak: (id: string, text: string) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  speakingMsgId,
  onSpeak
}) => {
  const isUser = message.sender === 'user';
  const isSpeaking = speakingMsgId === message.id;

  const renderContentWithCode = (text: string) => {
    const regex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return <CodeBlock key={idx} code={part.content} language={part.language} />;
      }
      return (
        <div key={idx} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {part.content}
        </div>
      );
    });
  };

  return (
    <div className={`msg-row-container ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="bot-avatar-icon">
          <AvisLogo size={16} />
        </div>
      )}

      <div style={{ flex: isUser ? '0 1 auto' : 1, maxWidth: isUser ? '85%' : '100%' }}>
        {message.docMeta && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              marginBottom: 8
            }}
          >
            <FileText size={14} color="var(--text-secondary)" />
            <span style={{ fontWeight: 500 }}>{message.docMeta.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>({message.docMeta.size})</span>
          </div>
        )}

        <div className={isUser ? 'msg-bubble-user' : 'msg-bubble-bot'}>
          {renderContentWithCode(message.content)}
        </div>

        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <button
              onClick={() => onSpeak(message.id, message.content)}
              aria-label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              style={{
                background: 'transparent',
                border: 'none',
                color: isSpeaking ? 'var(--status-error)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12
              }}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
