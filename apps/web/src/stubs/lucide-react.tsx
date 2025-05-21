import * as React from 'react'

const iconProps = {
  width: 16,
  height: 16,
  strokeWidth: 2,
  stroke: 'currentColor',
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const Lock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const Unlock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.84-1" />
  </svg>
)

export const Eye = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOff = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a17.3 17.3 0 0 1 5-5" />
    <path d="M3 3l18 18" />
  </svg>
)

export const Volume2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.5 5a9 9 0 0 1 0 14" />
  </svg>
)

export const VolumeX = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
)

// TODO(tauri-port): replace with real lucide-react once network install allowed
