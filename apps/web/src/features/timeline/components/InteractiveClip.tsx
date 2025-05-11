import * as React from 'react'
import Moveable from 'react-moveable'
import type { OnDrag, OnResize } from 'react-moveable'

import type { Clip as ClipType } from '../../../state/timelineStore'
import { useTimelineStore } from '../../../state/timelineStore'
import { Clip } from './Clip'

interface InteractiveClipProps {
  clip: ClipType
  pixelsPerSecond: number
  /** Track type to style the clip – video vs audio */
  type: 'video' | 'audio'
}

export const InteractiveClip: React.FC<InteractiveClipProps> = ({ clip, pixelsPerSecond, type }) => {
  const updateClip = useTimelineStore((s) => s.updateClip)
  const ref = React.useRef<HTMLDivElement>(null)

  // Throttle clip updates via requestAnimationFrame to meet perf budget
  const rafId = React.useRef<number | null>(null)
  const pendingUpdate = React.useRef<Partial<ClipType>>({})

  const flushUpdate = React.useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current)
    }

    rafId.current = requestAnimationFrame(() => {
      if (Object.keys(pendingUpdate.current).length > 0) {
        updateClip(clip.id, pendingUpdate.current)
        pendingUpdate.current = {}
      }
      rafId.current = null
    })
  }, [clip.id, updateClip])

  const onDrag = (e: OnDrag) => {
    const { beforeTranslate } = e
    const [translateX] = beforeTranslate
    const newStart = clip.start + translateX / pixelsPerSecond
    const duration = clip.end - clip.start
    pendingUpdate.current = { start: newStart, end: newStart + duration }
    flushUpdate()
  }

  const onResize = (e: OnResize) => {
    const { width, direction, drag } = e
    const { beforeTranslate } = drag
    const [translateX] = beforeTranslate
    const newWidthSeconds = width / pixelsPerSecond

    if (direction[0] === -1) {
      // Resizing from left
      const newStart = clip.end - newWidthSeconds + translateX / pixelsPerSecond
      pendingUpdate.current = { start: newStart }
    } else {
      // Resizing from right
      const newEnd = clip.start + newWidthSeconds
      pendingUpdate.current = { end: newEnd }
    }
    flushUpdate()
  }

  return (
    <>
      <Clip ref={ref} clip={clip} pixelsPerSecond={pixelsPerSecond} type={type} />
      {ref.current && (
        <Moveable
          target={ref.current}
          draggable
          resizable
          edge={false}
          origin={false}
          keepRatio={false}
          throttleDrag={0}
          renderDirections={['w', 'e']}
          onDrag={onDrag}
          onResize={onResize}
        />
      )}
    </>
  )
} 