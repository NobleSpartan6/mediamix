import * as React from 'react'
import { Button } from '../../components/ui/Button'
import { useTransportStore } from '../../state/transportStore'
import { useTimelineStore } from '../../state/timelineStore'
import { useViewStore } from '../../state/viewStore'
import { Undo, Redo, Play, Pause, Scissors, Trash2, ZoomIn, ZoomOut, Magnet } from 'lucide-react'

export const MainToolbar: React.FC = () => {
  const playRate = useTransportStore((s) => s.playRate)
  const setPlayRate = useTransportStore((s) => s.setPlayRate)
  const splitClipAt = useTimelineStore((s) => s.splitClipAt)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const removeClip = useTimelineStore((s) => s.removeClip)
  const selectedIds = useTimelineStore((s) => s.selectedClipIds)
  const snapping = useTimelineStore((s) => s.snapping)
  const setSnapping = useTimelineStore((s) => s.setSnapping)
  const zoom = useViewStore((s) => s.timelineZoom)
  const setZoom = useViewStore((s) => s.setTimelineZoom)

  const handleDelete = React.useCallback(() => {
    selectedIds.forEach((id) => removeClip(id))
  }, [selectedIds, removeClip])

  const handleSplit = React.useCallback(() => splitClipAt(currentTime), [splitClipAt, currentTime])

  return (
    <div className="toolbar bg-gray-800 px-2 py-1 flex items-center space-x-1">
      <Button
        variant="secondary"
        className="toolbar-button"
        title="Undo (Ctrl+Z)"
        onClick={() => alert('Undo not implemented')}
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        className="toolbar-button"
        title="Redo (Ctrl+Y)"
        onClick={() => alert('Redo not implemented')}
      >
        <Redo className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        className="toolbar-button"
        title="Play/Pause (Space)"
        onClick={() => setPlayRate(playRate === 0 ? 1 : 0)}
      >
        {playRate === 0 ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </Button>
      <Button variant="secondary" className="toolbar-button" title="Split (C)" onClick={handleSplit}>
        <Scissors className="w-4 h-4" />
      </Button>
      <Button variant="secondary" className="toolbar-button" title="Delete (Del)" onClick={handleDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
      <Button variant="secondary" className="toolbar-button" title="Zoom In (+)" onClick={() => setZoom(zoom * 1.25)}>
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        className="toolbar-button"
        title="Zoom Out (-)"
        onClick={() => setZoom(Math.max(20, zoom / 1.25))}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        className={`toolbar-button ${snapping ? 'toolbar-toggle-active' : ''}`}
        title="Toggle Snap (S)"
        onClick={() => setSnapping(!snapping)}
      >
        <Magnet className="w-4 h-4" />
      </Button>
    </div>
  )
}

export default MainToolbar
