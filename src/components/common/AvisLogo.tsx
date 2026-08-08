import React from 'react';

interface AvisLogoProps {
  size?: number;
  className?: string;
}

export const AvisLogo: React.FC<AvisLogoProps> = ({ size = 26, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="avisGeoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      
      <linearGradient id="avisGeoGradFacetTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>

      <linearGradient id="avisGeoGradFacetRight" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>

      <linearGradient id="avisGeoGradFacetLeft" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>

      <linearGradient id="avisGeoGradCore" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>

      <filter id="avisLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Outer Precision Geometric Hexagonal Lattice Prism */}
    <g filter="url(#avisLogoGlow)">
      {/* Top Facet - Prism Apex */}
      <path
        d="M32 6L54 18.7L32 31.4L10 18.7L32 6Z"
        fill="url(#avisGeoGradFacetTop)"
        opacity="0.95"
      />

      {/* Left Facet - Structural Prism Wing */}
      <path
        d="M10 18.7L32 31.4L32 57L10 44.3L10 18.7Z"
        fill="url(#avisGeoGradFacetLeft)"
        opacity="0.88"
      />

      {/* Right Facet - Refractive Prism Wing */}
      <path
        d="M54 18.7L54 44.3L32 57L32 31.4L54 18.7Z"
        fill="url(#avisGeoGradFacetRight)"
        opacity="0.92"
      />

      {/* Floating Central Core Diamond Mark */}
      <path
        d="M32 18L41 24.5L32 40L23 24.5L32 18Z"
        fill="url(#avisGeoGradCore)"
      />

      {/* Precision Geometric Internal Energy Conduit Lines */}
      <path
        d="M32 6L32 31.4M32 31.4L10 44.3M32 31.4L54 44.3"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

