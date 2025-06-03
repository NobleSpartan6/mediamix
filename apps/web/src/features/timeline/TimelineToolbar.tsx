import * as React from 'react'
import { PlayPauseButton } from './components/PlayPauseButton'
import { ZoomSlider } from './components/ZoomSlider'
import { Button } from '../../components/ui/Button'
import { useTimelineStore } from '../../state/timelineStore'
import { Scissors, Trash2, Magnet, Crosshair } from 'lucide-react'

interface TimelineToolbarProps {
  zoom: number
  onZoomChange: (z: number) => void
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({ zoom, onZoomChange }) => {
  const splitClipAt = useTimelineStore((s) => s.splitClipAt)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const removeClip = useTimelineStore((s) => s.removeClip)
  const selected = useTimelineStore((s) => s.selectedClipIds)
  const setSelected = useTimelineStore((s) => s.setSelectedClips)
  const snapping = useTimelineStore((s) => s.snapping)
  const setSnapping = useTimelineStore((s) => s.setSnapping)
  const followPlayhead = useTimelineStore((s) => s.followPlayhead)
  const setFollowPlayhead = useTimelineStore((s) => s.setFollowPlayhead)

  const handleSplit = React.useCallback(() => splitClipAt(currentTime), [splitClipAt, currentTime])
  const handleDelete = React.useCallback(() => {
    selected.forEach((id) => removeClip(id))
    if (selected.length > 0) setSelected([])
  }, [removeClip, selected, setSelected])

  return (
    <div className="flex items-center space-x-2">
      <PlayPauseButton />
      <ZoomSlider value={zoom} onChange={onZoomChange} />
      <Button variant="secondary" className="px-2 py-1" onClick={handleSplit}>
        <Scissors className="w-4 h-4" />
      </Button>
      <Button variant="secondary" className="px-2 py-1" onClick={handleDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
      <Button variant="secondary" className="px-2 py-1" onClick={() => setSnapping(!snapping)}>
        <Magnet className="w-4 h-4" />
      </Button>
      <Button variant="secondary" className="px-2 py-1" onClick={() => setFollowPlayhead(!followPlayhead)}>
        <Crosshair className="w-4 h-4" />
      </Button>
    </div>
  )
}

TimelineToolbar.displayName = 'TimelineToolbar'
