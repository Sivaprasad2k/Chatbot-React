import React, { useState, useRef, useEffect } from 'react';
import { Settings, Info, Trash2, HardDrive, ChevronUp, Cpu } from 'lucide-react';
import { apiClient, BackendHealth } from '@/services/api/client';

interface SidebarWorkspacePanelProps {
  threadsCount: number;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
  onClearThreads: () => void;
}

export const SidebarWorkspacePanel: React.FC<SidebarWorkspacePanelProps> = ({
  threadsCount,
  onOpenAbout,
  onOpenSettings,
  onClearThreads
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<BackendHealth>({ status: 'CONFIGURATION_MISSING' });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      const res = await apiClient.checkHealth();
      setHealth(res);
    };
    fetchHealth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setIsOpen(false);
    if (window.confirm('Are you sure you want to clear all local conversations? This action cannot be undone.')) {
      onClearThreads();
    }
  };

  const isConnected = health.status === 'CONNECTED';

  return (
    <div className="sidebar-workspace-card" ref={menuRef}>
      {/* Popover Liquid Glass Menu */}
      {isOpen && (
        <div className="workspace-dropdown-menu">
          <div className="workspace-menu-header">
            <div className="storage-status-badge">
              <span
                className="storage-pulse-dot"
                style={{
                  backgroundColor: isConnected ? 'var(--accent-emerald)' : '#f59e0b',
                  boxShadow: isConnected ? '0 0 8px var(--accent-emerald)' : '0 0 8px #f59e0b'
                }}
              />
              <span>{isConnected ? 'AI Inference Connected' : 'Frontend Only'}</span>
            </div>
            <span className="version-tag">v1.0.0</span>
          </div>

          <div className="workspace-menu-divider" />

          <button
            onClick={() => { setIsOpen(false); onOpenSettings(); }}
            className="workspace-menu-item"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAbout(); }}
            className="workspace-menu-item"
          >
            <Info size={14} />
            <span>About Avis</span>
          </button>

          <button
            onClick={handleClear}
            className="workspace-menu-item danger"
          >
            <Trash2 size={14} />
            <span>Clear Local Conversations</span>
          </button>

          <div className="workspace-menu-footer">
            <HardDrive size={12} color="var(--text-muted)" />
            <span>{threadsCount} {threadsCount === 1 ? 'conversation' : 'conversations'} in localStorage</span>
          </div>
        </div>
      )}

      {/* Main Panel Button Bar */}
      <div className="workspace-panel-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="workspace-panel-info">
          <div className="workspace-title-row">
            <span
              className="storage-pulse-dot"
              style={{
                backgroundColor: isConnected ? 'var(--accent-emerald)' : '#f59e0b',
                boxShadow: isConnected ? '0 0 8px var(--accent-emerald)' : '0 0 8px #f59e0b'
              }}
            />
            <span className="workspace-name">Local Workspace</span>
          </div>
          <div className="workspace-status-text">
            <span>{isConnected ? 'AI Active' : 'Frontend Only'}</span>
            <span className="dot-sep">•</span>
            <span className="version-text"><Cpu size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Vercel Serverless</span>
          </div>
        </div>

        <button
          className="workspace-toggle-btn"
          aria-label="Workspace Options"
        >
          <ChevronUp size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
        </button>
      </div>
    </div>
  );
};
