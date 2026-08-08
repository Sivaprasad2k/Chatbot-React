import React from 'react';
import { PanelLeft } from 'lucide-react';
import { AIModel } from '@/types/model';
import { ModelSelector } from './ModelSelector';
import { AvisLogo } from '@/components/common/AvisLogo';

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
      {/* Zone 1: Left Menu Toggle Button */}
      <div className="header-zone-left">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          className="header-menu-btn"
          title="Open menu"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* Zone 2: Center Brand Mark (Compact Logo & Wordmark) */}
      <div className="header-zone-center">
        <AvisLogo size={22} />
        <span className="header-brand-name">Avis</span>
      </div>

      {/* Zone 3: Right Contextual Controls */}
      <div className="header-zone-right">
        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
      </div>
    </header>
  );
};
