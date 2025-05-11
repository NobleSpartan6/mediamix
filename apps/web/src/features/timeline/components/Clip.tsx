import * as React from 'react'

import type { Clip as ClipType } from '../../../state/timelineStore'

interface ClipProps {
  clip: ClipType
  pixelsPerSecond: number
  /** Track type for styling */
  type: 'video' | 'audio'
}

/*
 * Memoized for perf – parent handles re-renders when clip array changes.
 * Inline styles are used here only for dynamic positioning/size which cannot
 * be expressed via Tailwind utility classes at build-time due to their
 * runtime nature.
 */
export const Clip = React.forwardRef<HTMLDivElement, ClipProps>(({ clip, pixelsPerSecond, type }, ref) => {
  const width = (clip.end - clip.start) * pixelsPerSecond
  const offset = clip.start * pixelsPerSecond
  const colorClass = type === 'video' ? 'bg-clip-video' : 'bg-clip-audio'

  return (
    <div
      ref={ref}
      // Container acts as `react-moveable` target. `group` enables hover state for handles.
      tabIndex={0}
      className={`group absolute top-0 h-full select-none rounded-sm border border-white/10 ${colorClass} text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      style={{ width, transform: `translateX(${offset}px)` }}
      aria-label={`Clip from ${clip.start.toFixed(2)}s to ${clip.end.toFixed(2)}s`}
    >
      {/* Left edge handle */}
      <div
        className="absolute left-0 top-0 h-full w-1 bg-white/70 opacity-0 group-hover:opacity-100 cursor-ew-resize"
        aria-hidden="true"
      />
      {/* Right edge handle */}
      <div
        className="absolute right-0 top-0 h-full w-1 bg-white/70 opacity-0 group-hover:opacity-100 cursor-ew-resize"
        aria-hidden="true"
      />
    </div>
  )
})

Clip.displayName = 'Clip' 