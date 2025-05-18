import { useMemo } from 'react'
import { useTimelineStore } from '../../../state/timelineStore'
import type { Clip } from '../../../state/timelineStore'

/**
 * Memoized selector returning an array of clips from the
 * timeline store's normalized dictionary.
 */
export const useClipsArray = (): Clip[] => {
  const clipsById = useTimelineStore((s) => s.clipsById)
  return useMemo(() => Object.values(clipsById), [clipsById])
}
