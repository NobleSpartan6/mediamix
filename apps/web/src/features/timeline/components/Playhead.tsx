import * as React from 'react'

interface PlayheadProps {
  /** playhead position in seconds */
  positionSeconds: number
  pixelsPerSecond: number
  /** Height of the timeline area to span */
  height: number | string
}

/**
 * Playhead – simple vertical line representing the current playhead location.
 * For MVP it is purely presentational driven by parent state.
 */
export const Playhead: React.FC<PlayheadProps> = React.memo(({ positionSeconds, pixelsPerSecond, height }) => {
  const x = positionSeconds * pixelsPerSecond
  return (
    <div
      className="absolute top-0 w-0.5 bg-accent pointer-events-none"
      style={{ height, transform: `translateX(${x}px)` }}
    />
  )
})

Playhead.displayName = 'Playhead' 