import React, { useRef } from 'react';
import { Paperclip, Mic, MicOff, ArrowUp, X, FileText } from 'lucide-react';
import { DocMeta } from '@/types/chat';
import { AudioMeter } from './AudioMeter';

interface InputDockProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isListening: boolean;
  audioLevel: number;
  onToggleListening: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  docMeta: DocMeta | null;
  onRemoveDoc: () => void;
  isLoading: boolean;
  modelName: string;
}

export const InputDock: React.FC<InputDockProps> = ({
  inputText,
  onChangeText,
  onSubmit,
  isListening,
  audioLevel,
  onToggleListening,
  onFileSelect,
  docMeta,
  onRemoveDoc,
  isLoading,
  modelName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmitDisabled = (!inputText.trim() && !docMeta) || isLoading;

  const handleTextChange = (val: string) => {
    onChangeText(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitDisabled) {
        onSubmit(e);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  return (
    <footer className="input-dock-footer" aria-label="Chat input dock">
      <div className="liquid-glass-dock">
        {isListening && <AudioMeter audioLevel={audioLevel} />}

        {docMeta && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              backgroundColor: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-12)',
              marginBottom: 8,
              fontSize: 12
            }}
          >
            <FileText size={14} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 500 }}>{docMeta.name}</span>
            <button
              type="button"
              onClick={onRemoveDoc}
              aria-label="Remove document"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
          }}
          className="input-form-flex"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach PDF or text files"
            className="icon-action-btn"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={onFileSelect}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={onToggleListening}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
            className="icon-action-btn"
            style={{ color: isListening ? 'var(--status-error)' : undefined }}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to voice... speak now...'
                : `Ask ${modelName} anything...`
            }
            disabled={isLoading}
            className="main-prompt-input textarea-auto-grow"
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            aria-label="Send message"
            className={`submit-send-btn ${isSubmitDisabled ? 'disabled' : 'active'}`}
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>
    </footer>
  );
};
