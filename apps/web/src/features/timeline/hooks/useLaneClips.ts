import { useMemo } from 'react'
import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip } from '../../../state/timelineStore'

/**
 * Return clips for the given lane sorted by start time.
 */
export const useLaneClips = (lane: number): Clip[] => {
  const clipsById = useTimelineStore((s) => s.clipsById)
  return useMemo(
    () =>
      Object.values(clipsById)
        .filter((c) => c.lane === lane)
        .sort((a, b) => a.start - b.start),
    [clipsById, lane],
  )
}
