import { useMemo } from 'react'
import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip } from '../../../state/timelineStore'

/**
 * Return clips on the given lane as a stable array sorted by start time.
 * Memoizes the result to avoid infinite update loops with useSyncExternalStore.
 */
export const useLaneClips = (lane: number): Clip[] => {
  const clipsById = useTimelineStore((s) => s.clipsById)
  return useMemo(() => {
    return Object.values(clipsById)
      .filter((c) => c.lane === lane)
      .sort((a, b) => a.start - b.start)
  }, [clipsById, lane])
}
