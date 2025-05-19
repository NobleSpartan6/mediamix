import { useMemo } from 'react'

import { useTimelineStore } from '../../../state/timelineStore'

/**
 * Convert the globally stored `beats` array into an array of *clip slice* objects.
 * Each slice represents the timeline segment between two consecutive beats.
 *
 * The resulting array is memoised and recalculated only when the `beats` array
 * changes (reference comparison from Zustand selector).
 *
 * NOTE:  For the MVP we place all generated clips on **lane 0** (video lane).
 *        Subsequent subtasks may distribute slices across multiple lanes.
 */
export const useBeatSlices = () => {
  const beats = useTimelineStore((state) => state.beats)
  const tracks = useTimelineStore((state) => state.tracks)

  return useMemo(() => {
    if (!beats || beats.length < 2) return []

    const videoLaneCount = Math.max(
      1,
      tracks.filter((t) => t.type === 'video').length,
    )

    const slices = []
    for (let i = 0; i < beats.length - 1; i += 1) {
      const start = beats[i]
      const end = beats[i + 1]

      // Guard against malformed beat arrays where times are not ascending
      if (end <= start) continue

      const lane = (i % videoLaneCount) * 2

      slices.push({
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${start}-${end}`,
        start,
        end,
        lane,
      })
    }

    return slices
  }, [beats, tracks])
}
