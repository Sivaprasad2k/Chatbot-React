import React from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { Thread } from '@/types/chat';
import { AvisLogo } from '@/components/common/AvisLogo';
import { SidebarWorkspacePanel } from './SidebarWorkspacePanel';

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string;
  isOpen: boolean;
  onClose?: () => void;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string, e: React.MouseEvent) => void;
  onClearThreads: () => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  isOpen,
  onClose,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onClearThreads,
  onOpenAbout,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    onSelectThread(id);
    if (window.innerWidth <= 1023 && onClose) {
      onClose();
    }
  };

  const handleNew = () => {
    onNewThread();
    if (window.innerWidth <= 1023 && onClose) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="sidebar-backdrop"
        onClick={onClose}
        aria-label="Close sidebar overlay"
      />
      <aside className="avis-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvisLogo size={26} />
            <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>
              Avis
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="drawer-close-btn"
              aria-label="Close menu drawer"
              title="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button onClick={handleNew} className="new-chat-btn-wide">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Chat
          </span>
          <span className="kbd-badge">⌘K</span>
        </button>

        {/* Recent Chats Timeline */}
        <div className="sidebar-section-label">Recent Chats</div>

        <div className="thread-list-box">
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => handleSelect(thread.id)}
                className={`thread-item-row ${isActive ? 'active' : ''}`}
              >
                <MessageSquare size={15} style={{ opacity: 0.7 }} />
                <span className="thread-title-text">{thread.title}</span>
                <button
                  onClick={(e) => onDeleteThread(thread.id, e)}
                  title="Delete chat thread"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 4
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Local Workspace Panel Footer */}
        <SidebarWorkspacePanel
          threadsCount={threads.length}
          onOpenAbout={onOpenAbout}
          onOpenSettings={onOpenSettings}
          onClearThreads={onClearThreads}
        />
      </aside>
    </>
  );
};

