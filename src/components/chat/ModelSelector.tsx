import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Brain, Zap, Search } from 'lucide-react';
import { AIModel, AVAILABLE_MODELS } from '@/types/model';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'avis-core': return <Sparkles size={15} color="var(--accent-emerald)" />;
      case 'avis-analytical': return <Brain size={15} color="var(--accent-cyan)" />;
      case 'avis-flash': return <Zap size={15} color="var(--accent-emerald)" />;
      case 'avis-search': return <Search size={15} color="var(--accent-cyan)" />;
      default: return <Sparkles size={15} />;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="glass-model-badge"
      >
        {getModelIcon(selectedModel.id)}
        <span>{selectedModel.name}</span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div role="listbox" className="glass-dropdown-menu">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = model.id === selectedModel.id;
            return (
              <div
                key={model.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectModel(model);
                  setIsOpen(false);
                }}
                className={`glass-dropdown-item ${isSelected ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getModelIcon(model.id)} {model.name}
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    {model.badge}
                  </span>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {model.description}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
