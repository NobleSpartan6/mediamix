import * as React from 'react'
import { useTimelineStore } from '../../../state/timelineStore'

interface GhostCutsProps {
  pixelsPerSecond: number
  height: number | string
}

export const GhostCuts: React.FC<GhostCutsProps> = React.memo(({ pixelsPerSecond, height }) => {
  const beats = useTimelineStore.getState().beats
  if (!beats || beats.length === 0) return null

  return (
    <>
      {beats.map((b) => (
        <div
          key={b}
          className="absolute top-0 w-px border-r border-dashed border-accent/40 pointer-events-none"
          style={{ height, transform: `translateX(${b * pixelsPerSecond}px)` }}
        />
      ))}
    </>
  )
})

GhostCuts.displayName = 'GhostCuts'
