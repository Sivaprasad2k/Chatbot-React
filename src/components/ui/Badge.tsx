import React from 'react';
import './ui.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  return (
    <span className={`avis-badge avis-badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
