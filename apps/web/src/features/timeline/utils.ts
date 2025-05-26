import { nanoid } from '../../utils/nanoid'
import { useMediaStore } from '../../state/mediaStore'
import { useTimelineStore } from '../../state/timelineStore'

export function insertAssetToTimeline(assetId: string, startSec?: number) {
  const { assets } = useMediaStore.getState()
  const asset = assets[assetId]
  if (!asset) return

  const timeline = useTimelineStore.getState()
  const { addClip, tracks } = timeline

  const ext = asset.fileName.split('.').pop()?.toLowerCase() ?? ''
  const audioOnly = /^(mp3|wav|flac|ogg|aac|m4a)$/.test(ext)
  const duration = asset.duration
  const start = startSec ?? 0
  const end = start + duration

  let baseLane = tracks.length
  const groupId = nanoid()

  if (audioOnly) {
    addClip(
      { start, end, lane: baseLane, assetId },
      { trackType: 'audio', groupId },
    )
  } else {
    addClip(
      { start, end, lane: baseLane, assetId },
      { trackType: 'video', groupId },
    )
    addClip(
      { start, end, lane: baseLane + 1, assetId },
      { trackType: 'audio', groupId },
    )
  }

  useTimelineStore.setState((s) => ({
    durationSec: Math.max(s.durationSec, end),
  }))
}

/**
 * Find the beat marker closest to the given time.
 * Simple linear search as beat arrays are typically short.
 */
export function getNearestBeat(time: number, beats: number[]): number {
  if (beats.length === 0) return time
  return beats.reduce((prev, b) =>
    Math.abs(b - time) < Math.abs(prev - time) ? b : prev,
    beats[0])
}
