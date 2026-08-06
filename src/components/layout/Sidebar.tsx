import React from 'react';
import { Plus, MessageSquare, Trash2, Shield } from 'lucide-react';
import { Thread } from '@/types/chat';

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string;
  isOpen: boolean;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string, e: React.MouseEvent) => void;
  onOpenAbout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  isOpen,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onOpenAbout
}) => {
  if (!isOpen) return null;

  return (
    <aside className="avis-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="brand-icon-box">A</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>Avis</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            ADAPTIVE VIRTUAL INTELLIGENCE
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <button onClick={onNewThread} className="new-chat-btn-wide">
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
              onClick={() => onSelectThread(thread.id)}
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

      {/* User Profile Card Footer */}
      <div className="sidebar-profile-card">
        <div className="profile-avatar">SP</div>
        <div className="profile-info">
          <span className="profile-name">Siva Prasad</span>
          <span className="profile-email">siva.prasad@email.com</span>
        </div>
        <button
          onClick={onOpenAbout}
          title="About Avis"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <Shield size={15} />
        </button>
      </div>
    </aside>
  );
};
