import React from 'react';

interface AudioMeterProps {
  audioLevel: number;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ audioLevel }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        backgroundColor: 'rgba(248, 113, 113, 0.12)',
        border: '1px solid rgba(248, 113, 113, 0.25)',
        borderRadius: 'var(--radius-full)',
        marginBottom: 8,
        fontSize: 12,
        color: 'var(--status-error)',
        fontWeight: 500
      }}
    >
      <span>Listening</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
        <div style={{ width: 3, height: Math.max(4, Math.min(14, audioLevel * 0.3)), backgroundColor: 'var(--status-error)', borderRadius: 2 }} />
        <div style={{ width: 3, height: Math.max(6, Math.min(16, audioLevel * 0.5)), backgroundColor: 'var(--status-error)', borderRadius: 2 }} />
        <div style={{ width: 3, height: Math.max(4, Math.min(14, audioLevel * 0.2)), backgroundColor: 'var(--status-error)', borderRadius: 2 }} />
      </div>
    </div>
  );
};
