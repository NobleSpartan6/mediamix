import * as React from 'react'
import { createPortal } from 'react-dom'
import Moveable from 'react-moveable'
import type { OnDrag, OnResize } from 'react-moveable'

import type { Clip as ClipType } from '../../../state/timelineStore'
import { useTimelineStore } from '../../../state/timelineStore'
import { useClipsArray } from '../hooks/useClipsArray'
import { Clip } from './Clip'

interface InteractiveClipProps {
  clip: ClipType
  pixelsPerSecond: number
  /** Track type to style the clip – video vs audio */
  type: 'video' | 'audio'
}

export const InteractiveClip: React.FC<InteractiveClipProps> = React.memo(({ clip, pixelsPerSecond, type }) => {
  const updateClip = useTimelineStore((s) => s.updateClip)
  const beats = useTimelineStore((s) => s.beats)
  const clips = useClipsArray()
  const ref = React.useRef<HTMLDivElement>(null)

  const SNAP_THRESHOLD = 0.1 // seconds

  const neighborTimes = React.useMemo(() => {
    return clips
      .filter((c) => c.id !== clip.id && c.lane === clip.lane)
      .flatMap((c) => [c.start, c.end])
  }, [clips, clip.id, clip.lane])

  const snapCandidates = React.useMemo(
    () => [...beats, ...neighborTimes],
    [beats, neighborTimes],
  )

  const findSnap = React.useCallback(
    (time: number): number | null => {
      let nearest: number | null = null
      let minDiff = SNAP_THRESHOLD
      snapCandidates.forEach((t) => {
        const diff = Math.abs(t - time)
        if (diff <= minDiff) {
          nearest = t
          minDiff = diff
        }
      })
      return nearest
    },
    [snapCandidates],
  )

  const [snapTime, setSnapTime] = React.useState<number | null>(null)

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
    let newStart = origin.current.startSec + translateX / pixelsPerSecond
    const snap = findSnap(newStart)
    if (snap !== null) {
      newStart = snap
      translateXRef.current = (snap - origin.current.startSec) * pixelsPerSecond
      setSnapTime(snap)
    } else {
      translateXRef.current = translateX
      setSnapTime(null)
    }
    const translateTarget = newStart * pixelsPerSecond
    applyTransform(translateTarget)
  }

  const onDragEnd = (/* e: OnDragEnd */ _e: OnDrag) => {
    const finalStart =
      snapTime !== null
        ? snapTime
        : origin.current.startSec + translateXRef.current / pixelsPerSecond
    const duration = origin.current.endSec - origin.current.startSec
    updateClip(clip.id, { start: finalStart, end: finalStart + duration })
    setSnapTime(null)
  }

  const onResize = (e: OnResize) => {
    const { width, direction, drag } = e
    const { beforeTranslate } = drag
    const [translateX] = beforeTranslate

    let newWidthPx = width
    
    if (direction[0] === -1) {
      // Resizing from left – update translate as well as width
      let newStart = origin.current.endSec - newWidthPx / pixelsPerSecond + translateX / pixelsPerSecond
      const snap = findSnap(newStart)
      if (snap !== null) {
        newStart = snap
        newWidthPx = (origin.current.endSec - snap) * pixelsPerSecond
        setSnapTime(snap)
        applyTransform(newStart * pixelsPerSecond, newWidthPx)
      } else {
        setSnapTime(null)
        const translateTarget = origin.current.endSec * pixelsPerSecond - newWidthPx + translateX
        applyTransform(translateTarget, newWidthPx)
      }
    } else {
      // Resizing from right – transform unchanged, only width scales
      let newEnd = origin.current.startSec + newWidthPx / pixelsPerSecond
      const snap = findSnap(newEnd)
      if (snap !== null) {
        newEnd = snap
        newWidthPx = (newEnd - origin.current.startSec) * pixelsPerSecond
        setSnapTime(snap)
      } else {
        setSnapTime(null)
      }
      applyTransform(origin.current.startSec * pixelsPerSecond, newWidthPx)
    }
  }

  const onResizeEnd = (e: OnResize) => {
    const { width, direction, drag } = e
    const { beforeTranslate } = drag
    const [translateX] = beforeTranslate

    const newWidthSeconds = width / pixelsPerSecond

    if (direction[0] === -1) {
      let newStart = origin.current.endSec - newWidthSeconds + translateX / pixelsPerSecond
      if (snapTime !== null) newStart = snapTime
      updateClip(clip.id, { start: newStart })
    } else {
      let newEnd = origin.current.startSec + newWidthSeconds
      if (snapTime !== null) newEnd = snapTime
      updateClip(clip.id, { end: newEnd })
    }
    setSnapTime(null)
  }

  return (
    <>
      {snapTime !== null &&
        ref.current?.parentElement &&
        createPortal(
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent/60 pointer-events-none"
            style={{ transform: `translateX(${snapTime * pixelsPerSecond}px)` }}
          />,
          ref.current.parentElement,
        )}
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
