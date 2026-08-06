import React from 'react';

interface AvisLogoProps {
  size?: number;
  className?: string;
}

export const AvisLogo: React.FC<AvisLogoProps> = ({ size = 26, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="avisGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10a37f" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="avisGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>

    {/* Interlocking Outer Precision Arcs */}
    <path
      d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C30.6 44 36.4 40.8 40 35.8"
      stroke="url(#avisGrad1)"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M24 10C16.268 10 10 16.268 10 24C10 31.732 16.268 38 24 38C28.8 38 33 35.6 35.6 32"
      stroke="url(#avisGrad1)"
      strokeWidth="2.8"
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Central Geometric Diamond Core */}
    <path
      d="M24 14L26.5 21.5L34 24L26.5 26.5L24 34L21.5 26.5L14 24L21.5 21.5L24 14Z"
      fill="url(#avisGrad2)"
    />
  </svg>
);
