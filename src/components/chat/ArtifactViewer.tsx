import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ArtifactViewerProps {
  code: string;
  language: string;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ code, language }) => {
  const [showPreview, setShowPreview] = useState(false);
  const langLower = (language || '').toLowerCase();
  const isRenderable = ['html', 'svg', 'xml'].includes(langLower);

  if (!isRenderable) return null;

  return (
    <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border-subtle)' }}>
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-surface-0)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          padding: '5px 12px',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
        {showPreview ? 'Hide Artifact Sandbox' : 'Render Artifact Sandbox'}
      </button>

      {showPreview && (
        <div
          style={{
            marginTop: 10,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#ffffff',
            minHeight: 200
          }}
        >
          {langLower === 'svg' ? (
            <div
              style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              dangerouslySetInnerHTML={{ __html: code }}
            />
          ) : (
            <iframe
              title="Artifact Preview Sandbox"
              srcDoc={`<!DOCTYPE html><html><head><style>body { font-family: system-ui, sans-serif; padding: 16px; color: #18181b; background: #fff; }</style></head><body>${code}</body></html>`}
              sandbox="allow-scripts"
              style={{ width: '100%', height: 240, border: 'none' }}
            />
          )}
        </div>
      )}
    </div>
  );
};
