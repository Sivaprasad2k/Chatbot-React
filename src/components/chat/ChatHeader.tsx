import React from 'react';
import { PanelLeft } from 'lucide-react';
import { AIModel } from '@/types/model';
import { ModelSelector } from './ModelSelector';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  selectedModel,
  onSelectModel
}) => {
  return (
    <header className="avis-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="icon-btn-ghost"
        >
          <PanelLeft size={16} />
        </button>

        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
      </div>
    </header>
  );
};
