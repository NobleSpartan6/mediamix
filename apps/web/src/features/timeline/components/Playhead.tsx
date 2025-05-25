import * as React from 'react'

/** Props for the {@link Playhead} component. */
interface PlayheadProps {
  /** Playhead position in seconds */
  positionSeconds: number
  /** Pixels per second used to calculate x position */
  pixelsPerSecond: number
  /** Height of the timeline area to span */
  height: number | string
  /** Scroll offset to subtract when overlaid */
  offsetX?: number
  /** Pointer down handler for scrubbing */
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  /** Enable pointer events when interactive */
  interactive?: boolean
}

/**
 * Vertical line showing the current playhead location.
 * Purely presentational and controlled by parent state.
 *
 * @param positionSeconds playhead position in seconds
 * @param pixelsPerSecond zoom scale for converting time to pixels
 * @param height height of the line
 * @param offsetX horizontal scroll offset when overlaid
 * @returns visual playhead line element
 */
export const Playhead: React.FC<PlayheadProps> = React.memo(
  ({ positionSeconds, pixelsPerSecond, height, offsetX = 0, onPointerDown, interactive = false }) => {
    const x = positionSeconds * pixelsPerSecond - offsetX
    return (
      <div
        onPointerDown={interactive ? onPointerDown : undefined}
        className={`absolute top-0 w-0.5 bg-accent ${interactive ? 'cursor-ew-resize' : 'pointer-events-none'}`}
        style={{ height, transform: `translateX(${x}px)` }}
      />
    )
  },
)

Playhead.displayName = 'Playhead' 
