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

export const InteractiveClip: React.FC<InteractiveClipProps> = React.memo(({ clip, pixelsPerSecond, type }) => {
  const updateClip = useTimelineStore((s) => s.updateClip)
  const ref = React.useRef<HTMLDivElement>(null)

  // mutable refs to store original values at the start of interaction
  const origin = React.useRef({ startSec: clip.start, endSec: clip.end, widthPx: 0 })
  const translateXRef = React.useRef(0)

  // --- Imperative DOM updates -------------------------------------------------
  const applyTransform = React.useCallback(
    (translateXPx: number, newWidthPx?: number) => {
      if (!ref.current) return
      // only update properties that are cheap for the compositor
      ref.current.style.transform = `translateX(${translateXPx}px)`
      if (newWidthPx !== undefined) {
        // Width changes are unavoidable during resize; keep them minimal.
        ref.current.style.width = `${newWidthPx}px`
      }
    },
    [],
  )

  // ---------------------------------------------------------------------------

  const onDragStart = () => {
    origin.current = {
      startSec: clip.start,
      endSec: clip.end,
      widthPx: (clip.end - clip.start) * pixelsPerSecond,
    }
  }

  const onDrag = (e: OnDrag) => {
    const { beforeTranslate } = e
    const [translateX] = beforeTranslate
    translateXRef.current = translateX
    const translateTarget = origin.current.startSec * pixelsPerSecond + translateX
    applyTransform(translateTarget)
  }

  const onDragEnd = (/* e: OnDragEnd */ _e: OnDrag) => {
    const newStart = origin.current.startSec + translateXRef.current / pixelsPerSecond
    const duration = origin.current.endSec - origin.current.startSec
    updateClip(clip.id, { start: newStart, end: newStart + duration })
  }

  const onResize = (e: OnResize) => {
    const { width, direction, drag } = e
    const { beforeTranslate } = drag
    const [translateX] = beforeTranslate

    const newWidthPx = width

    if (direction[0] === -1) {
      // Resizing from left – update translate as well as width
      const translateTarget = origin.current.endSec * pixelsPerSecond - newWidthPx + translateX
      applyTransform(translateTarget, newWidthPx)
    } else {
      // Resizing from right – transform unchanged, only width scales
      applyTransform(origin.current.startSec * pixelsPerSecond, newWidthPx)
    }
  }

  const onResizeEnd = (e: OnResize) => {
    const { width, direction, drag } = e
    const { beforeTranslate } = drag
    const [translateX] = beforeTranslate

    const newWidthSeconds = width / pixelsPerSecond

    if (direction[0] === -1) {
      const newStart = origin.current.endSec - newWidthSeconds + translateX / pixelsPerSecond
      updateClip(clip.id, { start: newStart })
    } else {
      const newEnd = origin.current.startSec + newWidthSeconds
      updateClip(clip.id, { end: newEnd })
    }
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
          onDragStart={onDragStart}
          onDrag={onDrag}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: react-moveable event type incompatibilities
          onDragEnd={onDragEnd as unknown as (e: unknown) => void}
          onResize={onResize as unknown as (e: unknown) => void}
          // Type cast is necessary due to react-moveable's overloaded type definitions
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onResizeEnd={onResizeEnd as unknown as (e: unknown) => void}
        />
      )}
    </>
  )
})

InteractiveClip.displayName = 'InteractiveClip'
