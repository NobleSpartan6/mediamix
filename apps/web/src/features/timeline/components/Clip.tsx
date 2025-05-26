import * as React from 'react'

import type { Clip as ClipType } from '../../../state/timelineStore'
import { useMediaStore } from '../../../state/mediaStore'
import { useTimelineStore } from '../../../state/timelineStore'

/** Props for {@link Clip}. */
interface ClipProps {
  /** Clip data describing timing and lane */
  clip: ClipType
  /** Zoom level in pixels per second for sizing */
  pixelsPerSecond: number
  /** Track type for styling */
  type: 'video' | 'audio'
}

/**
 * Visual representation of a timeline clip.
 *
 * Memoized for performance – parent components re-render when the clip array
 * changes. Uses inline styles for positioning/size which depend on runtime
 * values (start, end, zoom level).
 */
export const Clip = React.memo(
  React.forwardRef<HTMLDivElement, ClipProps>(({ clip, pixelsPerSecond, type }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const selectedIds = useTimelineStore((s) => s.selectedClipIds)
    const setSelected = useTimelineStore((s) => s.setSelectedClips)
    const isSelected = selectedIds.includes(clip.id)

    // expose DOM node to parent
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement)

    const width = (clip.end - clip.start) * pixelsPerSecond
    const offset = clip.start * pixelsPerSecond
    const colorClass = type === 'video' ? 'bg-clip-video' : 'bg-clip-audio'

    // Lookup associated media asset (fallback to first asset if none specified)
    const asset = useMediaStore(
      React.useCallback(
        (s) => (clip.assetId ? s.assets[clip.assetId] : Object.values(s.assets)[0]),
        [clip.assetId],
      ),
    )

    // Draw waveform for audio clips when peaks or size change
    React.useEffect(() => {
      if (type !== 'audio') return
      const div = localRef.current
      const canvas = canvasRef.current
      if (!div || !canvas) return

      const draw = () => {
        const w = div.clientWidth
        const h = div.clientHeight
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, w, h)
        const peaks = asset?.waveform
        if (!peaks || peaks.length === 0) return
        const mid = h / 2
        const step = peaks.length / w
        ctx.strokeStyle = '#fff'
        ctx.beginPath()
        for (let x = 0; x < w; x += 1) {
          const i = Math.floor(x * step)
          const amp = Math.abs(peaks[i]) * mid
          ctx.moveTo(x + 0.5, mid - amp)
          ctx.lineTo(x + 0.5, mid + amp)
        }
        ctx.stroke()
      }

      draw()
      const ro = new ResizeObserver(draw)
      ro.observe(div)
      return () => ro.disconnect()
    }, [asset?.waveform, type])

    const backgroundImage =
      type === 'video' && asset?.thumbnail ? `url(${asset.thumbnail})` : undefined

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        e.stopPropagation()
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          if (isSelected) {
            setSelected(selectedIds.filter((id) => id !== clip.id))
          } else {
            setSelected([...selectedIds, clip.id])
          }
        } else if (!isSelected || selectedIds.length > 1) {
          setSelected([clip.id])
        }
      },
      [clip.id, isSelected, selectedIds, setSelected],
    )

    return (
      <div
        ref={localRef}
        // Container acts as `react-moveable` target. `group` enables hover state for handles.
        tabIndex={0}
        className={`clip group absolute top-0 h-full select-none rounded-sm border border-white/10 ${colorClass} text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isSelected ? 'ring-2 ring-accent' : ''}`}
        onPointerDown={handlePointerDown}
        style={{ width, transform: `translateX(${offset}px)`, willChange: 'transform', backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-label={`Clip from ${clip.start.toFixed(2)}s to ${clip.end.toFixed(2)}s`}
      >
        {type === 'audio' && <canvas ref={canvasRef} className="w-full h-full" />}
        {/* Left edge handle */}
        <div
          className="absolute left-0 top-0 h-full w-1 bg-white/70 opacity-0 group-hover:opacity-100 cursor-ew-resize"
          aria-hidden="true"
        />
        {/* Right edge handle */}
        <div
          className="absolute right-0 top-0 h-full w-1 bg-white/70 opacity-0 group-hover:opacity-100 cursor-ew-resize"
          aria-hidden="true"
        />
      </div>
    )
  }),
)

Clip.displayName = 'Clip'
