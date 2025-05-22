import * as React from 'react'
import { createPortal } from 'react-dom'
import Moveable from 'react-moveable'
import type { OnDrag, OnResize } from 'react-moveable'

import type { Clip as ClipType } from '../../../state/timelineStore'
import { useTimelineStore } from '../../../state/timelineStore'
import { useClipsArray } from '../hooks/useClipsArray'
import { Clip } from './Clip'

/** Props for {@link InteractiveClip}. */
interface InteractiveClipProps {
  /** Clip data to render and manipulate */
  clip: ClipType
  /** Current zoom level in pixels per second */
  pixelsPerSecond: number
  /** Track type to style the clip – video vs audio */
  type: 'video' | 'audio'
}

/**
 * Wrapper around {@link Clip} that adds drag and resize behavior via
 * `react-moveable`.
 *
 * @param clip clip data being edited
 * @param pixelsPerSecond zoom level for positioning
 * @param type media type to style the clip
 * @returns element rendering the interactive clip
 */
export const InteractiveClip: React.FC<InteractiveClipProps> = React.memo(({ clip, pixelsPerSecond, type }) => {
  const updateClip = useTimelineStore((s) => s.updateClip)
  const beats = useTimelineStore((s) => s.beats)
  const tracks = useTimelineStore((s) => s.tracks)
  const clips = useClipsArray()
  const ref = React.useRef<HTMLDivElement>(null)

  const SNAP_THRESHOLD = 0.1 // seconds

  const laneHeights = React.useMemo(
    () => tracks.map((t) => (t.type === 'video' ? 48 : 32)),
    [tracks],
  )
  const laneTypes = React.useMemo(() => tracks.map((t) => t.type), [tracks])
  const laneOffsets = React.useMemo(() => {
    let off = 0
    return laneHeights.map((h) => {
      const o = off
      off += h
      return o
    })
  }, [laneHeights])

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
  const translateYRef = React.useRef(0)
  const laneRef = React.useRef(clip.lane)

  // --- Imperative DOM updates -------------------------------------------------
  const applyTransform = React.useCallback(
    (x: number, y = 0, newWidthPx?: number) => {
      if (!ref.current) return
      ref.current.style.transform = `translate(${x}px, ${y}px)`
      if (newWidthPx !== undefined) {
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
    translateYRef.current = 0
    laneRef.current = clip.lane
  }

  const clipTrackType = React.useMemo(
    () => laneTypes[clip.lane] ?? type,
    [laneTypes, clip.lane, type],
  )

  const onDrag = (e: OnDrag) => {
    const { beforeTranslate } = e
    const [translateX, translateY] = beforeTranslate
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
    const yAbs = laneOffsets[clip.lane] + translateY
    let lane = clip.lane
    for (let i = 0; i < laneOffsets.length; i += 1) {
      const off = laneOffsets[i]
      const h = laneHeights[i]
      if (yAbs >= off && yAbs < off + h) {
        lane = i
        break
      }
    }
    if (laneTypes[lane] !== clipTrackType) {
      lane = clip.lane
    }
    laneRef.current = lane
    const yTarget = laneOffsets[lane] - laneOffsets[clip.lane]
    translateYRef.current = yTarget
    const translateTarget = newStart * pixelsPerSecond
    applyTransform(translateTarget, yTarget)
  }

  const onDragEnd = (/* e: OnDragEnd */ _e: OnDrag) => {
    const finalStart =
      snapTime !== null
        ? snapTime
        : origin.current.startSec + translateXRef.current / pixelsPerSecond
    const duration = origin.current.endSec - origin.current.startSec
    const finalLane =
      laneTypes[laneRef.current] === clipTrackType ? laneRef.current : clip.lane
    laneRef.current = finalLane
    updateClip(clip.id, {
      start: finalStart,
      end: finalStart + duration,
      lane: finalLane,
    })
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
        applyTransform(newStart * pixelsPerSecond, translateYRef.current, newWidthPx)
      } else {
        setSnapTime(null)
        const translateTarget = origin.current.endSec * pixelsPerSecond - newWidthPx + translateX
        applyTransform(translateTarget, translateYRef.current, newWidthPx)
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
      applyTransform(origin.current.startSec * pixelsPerSecond, translateYRef.current, newWidthPx)
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
