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
export const Play = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

export const Pause = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

export const Scissors = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8" y2="16" />
    <line x1="8" y1="8" x2="20" y2="20" />
  </svg>
)

export const Trash2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <rect x="9" y="2" width="6" height="4" />
  </svg>
)

export const Magnet = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <line x1="4" y1="15" x2="4" y2="21" />
    <line x1="20" y1="15" x2="20" y2="21" />
  </svg>
)

export const Crosshair = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
)

export const Undo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <path d="M9 14H5v-4" />
    <path d="M20 20a8 8 0 0 0-8-8H5" />
  </svg>
)

export const Redo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <path d="M15 10h4v4" />
    <path d="M4 20a8 8 0 0 1 8-8h7" />
  </svg>
)

export const ZoomIn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export const ZoomOut = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...iconProps} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
