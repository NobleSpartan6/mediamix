import * as React from 'react'
import { Button } from '../../../components/ui/Button'
import { useTimelineStore } from '../../../state/timelineStore'
import { getNearestBeat } from '../utils'

export const AlignToBeatButton: React.FC = () => {
  const beats = useTimelineStore((s) => s.beats)
  const selectedIds = useTimelineStore((s) => s.selectedClipIds)

  const handleAlign = React.useCallback(() => {
    const { selectedClipIds, beats, updateClip, getClip, tracks } =
      useTimelineStore.getState()
    const processed = new Set<string>()
    selectedClipIds.forEach((id) => {
      const clip = getClip(id)
      if (!clip) return
      const track = tracks[clip.lane]
      if (track?.locked) return
      if (clip.groupId && processed.has(clip.groupId)) return
      const nearest = getNearestBeat(clip.start, beats)
      const delta = nearest - clip.start
      updateClip(id, { start: nearest, end: clip.end + delta })
      if (clip.groupId) processed.add(clip.groupId)
    })
  }, [])

  const disabled = beats.length === 0 || selectedIds.length === 0

  return (
    <Button
      variant="secondary"
      className="px-2 py-1 text-xs"
      onClick={handleAlign}
      disabled={disabled}
      title="Snap selected clips to nearest beat"
    >
      Align to Beat
    </Button>
  )
}

AlignToBeatButton.displayName = 'AlignToBeatButton'
