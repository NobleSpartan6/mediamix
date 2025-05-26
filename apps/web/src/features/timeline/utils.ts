import { nanoid } from '../../utils/nanoid'
import { useMediaStore } from '../../state/mediaStore'
import { useTimelineStore } from '../../state/timelineStore'

export function insertAssetToTimeline(assetId: string) {
  const { assets } = useMediaStore.getState()
  const asset = assets[assetId]
  if (!asset) return

  const timeline = useTimelineStore.getState()
  const { addClip, tracks } = timeline

  const ext = asset.fileName.split('.').pop()?.toLowerCase() ?? ''
  const audioOnly = /^(mp3|wav|flac|ogg|aac|m4a)$/.test(ext)
  const duration = asset.duration

  let baseLane = tracks.length
  const groupId = nanoid()

  if (audioOnly) {
    addClip(
      { start: 0, end: duration, lane: baseLane, assetId },
      { trackType: 'audio', groupId },
    )
  } else {
    addClip(
      { start: 0, end: duration, lane: baseLane, assetId },
      { trackType: 'video', groupId },
    )
    addClip(
      { start: 0, end: duration, lane: baseLane + 1, assetId },
      { trackType: 'audio', groupId },
    )
  }
}
