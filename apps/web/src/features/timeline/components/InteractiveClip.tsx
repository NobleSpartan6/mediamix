import * as React from 'react'
import { createPortal } from 'react-dom'
import Moveable from 'react-moveable'
import type { OnDrag, OnResize } from 'react-moveable'

import type { Clip as ClipType } from '../../../state/timelineStore'
import {
  useTimelineStore,
  selectLaneClips,
} from '../../../state/timelineStore'
import { useMediaStore } from '../../../state/mediaStore'
import { useLaneClips } from '../hooks/useLaneClips'
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
 */
export const InteractiveClip: React.FC<InteractiveClipProps> = React.memo(
  ({ clip, pixelsPerSecond, type }) => {
    const updateClip = useTimelineStore((s) => s.updateClip)
    const beats = useTimelineStore((s) => s.beats)
    const tracks = useTimelineStore((s) => s.tracks)
    const asset = useMediaStore(
      React.useCallback(
        (s) => (clip.assetId ? s.assets[clip.assetId] : undefined),
        [clip.assetId],
      ),
    )
    const ref = React.useRef<HTMLDivElement>(null)

    // ------------------------------------------------------------------------
    // Cached timeline geometry helpers
    // ------------------------------------------------------------------------

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

    const clipTrackType = React.useMemo(
      () => laneTypes[clip.lane] ?? type,
      [laneTypes, clip.lane, type],
    )

    // ------------------------------------------------------------------------
    // Snap-reference lists
    // ------------------------------------------------------------------------

    const laneClips = useLaneClips(clip.lane)
    const neighborTimes = React.useMemo(
      () =>
        laneClips
          .filter((c) => c.id !== clip.id)
          .flatMap((c) => [c.start, c.end]),
      [laneClips, clip.id],
    )

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

    // ------------------------------------------------------------------------
    // Mutable refs for interaction bookkeeping
    // ------------------------------------------------------------------------

    const origin = React.useRef({
      startSec: clip.start,
      endSec: clip.end,
      widthPx: 0,
    })
    const translateXRef = React.useRef(0)
    const translateYRef = React.useRef(0)
    const laneRef = React.useRef(clip.lane)

    // ------------------------------------------------------------------------
    // Imperative DOM helpers
    // ------------------------------------------------------------------------

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

    const flashInvalid = React.useCallback(() => {
      const el = ref.current
      if (!el) return
      el.style.outline = '2px solid #f66'
      setTimeout(() => {
        if (el) el.style.outline = ''
      }, 300)
    }, [])

    // ------------------------------------------------------------------------
    // Moveable event handlers
    // ------------------------------------------------------------------------

    const onDragStart = () => {
      origin.current = {
        startSec: clip.start,
        endSec: clip.end,
        widthPx: (clip.end - clip.start) * pixelsPerSecond,
      }
      translateYRef.current = 0
      laneRef.current = clip.lane
    }

    const onDrag: OnDrag = (e) => {
      const { beforeTranslate } = e
      const [translateX, translateY] = beforeTranslate

      // --- horizontal movement / snapping ----------------------------------
      let newStart =
        origin.current.startSec + translateX / pixelsPerSecond
      const snap = findSnap(newStart)
      if (snap !== null) {
        newStart = snap
        translateXRef.current =
          (snap - origin.current.startSec) * pixelsPerSecond
        setSnapTime(snap)
      } else {
        translateXRef.current = translateX
        setSnapTime(null)
      }

      // --- vertical movement (lane change) ---------------------------------
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
      // Restrict to lanes of same media type
      if (laneTypes[lane] !== clipTrackType) {
        lane = clip.lane
      }
      laneRef.current = lane
      translateYRef.current = laneOffsets[lane] - laneOffsets[clip.lane]

      // --- apply transform --------------------------------------------------
      applyTransform(
        newStart * pixelsPerSecond,
        translateYRef.current,
      )
    }

    const onDragEnd: OnDrag = () => {
      // final start position (snap, clamp ≥0)
      let finalStart =
        snapTime !== null
          ? snapTime
          : origin.current.startSec +
            translateXRef.current / pixelsPerSecond
      finalStart = Math.max(0, finalStart)

      const duration =
        origin.current.endSec - origin.current.startSec
      const lane = laneRef.current

      // --------------------------------------------------------------------
      // Collision detection within destination lane
      // --------------------------------------------------------------------
      const laneClipsState = selectLaneClips(lane)(
        useTimelineStore.getState(),
      )

      let prevEnd = 0
      let nextStart = Infinity
      let collision = false

      laneClipsState.forEach((c) => {
        if (c.id === clip.id) return
        if (c.end <= finalStart) {
          prevEnd = Math.max(prevEnd, c.end)
        } else if (c.start >= finalStart + duration) {
          nextStart = Math.min(nextStart, c.start)
        } else {
          collision = true
        }
      })

      // if space is too small or clip overlaps, clamp into available gap
      if (nextStart - prevEnd < duration) {
        collision = true
        finalStart = origin.current.startSec
      } else {
        const clamped = Math.min(
          Math.max(finalStart, prevEnd),
          nextStart - duration,
        )
        if (clamped !== finalStart) collision = true
        finalStart = clamped
      }

      // final lane must match media type
      const finalLane =
        laneTypes[lane] === clipTrackType ? lane : clip.lane
      laneRef.current = finalLane

      // commit the change
      updateClip(clip.id, {
        start: finalStart,
        end: finalStart + duration,
        lane: finalLane,
      })

      if (collision) flashInvalid()
      setSnapTime(null)
    }

    const onResize: OnResize = (e) => {
      const { width, direction, drag } = e
      const { beforeTranslate } = drag
      const [translateX] = beforeTranslate

      let newWidthPx = width
      const maxDuration = asset?.duration ?? Infinity

      if (direction[0] === -1) {
        // resizing from left
        let newStart =
          origin.current.endSec -
          newWidthPx / pixelsPerSecond +
          translateX / pixelsPerSecond
        newStart = Math.max(
          newStart,
          origin.current.endSec - maxDuration,
        )
        const snap = findSnap(newStart)
        if (snap !== null) {
          newStart = snap
          newWidthPx =
            (origin.current.endSec - snap) * pixelsPerSecond
          setSnapTime(snap)
          applyTransform(
            newStart * pixelsPerSecond,
            translateYRef.current,
            newWidthPx,
          )
        } else {
          setSnapTime(null)
          const translateTarget =
            origin.current.endSec * pixelsPerSecond -
            newWidthPx +
            translateX
          applyTransform(
            translateTarget,
            translateYRef.current,
            newWidthPx,
          )
        }
      } else {
        // resizing from right
        let newEnd =
          origin.current.startSec + newWidthPx / pixelsPerSecond
        newEnd = Math.min(
          newEnd,
          origin.current.startSec + maxDuration,
        )
        const snap = findSnap(newEnd)
        if (snap !== null) {
          newEnd = snap
          newWidthPx =
            (newEnd - origin.current.startSec) * pixelsPerSecond
          setSnapTime(snap)
        } else {
          setSnapTime(null)
        }
        applyTransform(
          origin.current.startSec * pixelsPerSecond,
          translateYRef.current,
          newWidthPx,
        )
      }
    }

    const onResizeEnd: OnResize = (e) => {
      const { width, direction, drag } = e
      const { beforeTranslate } = drag
      const [translateX] = beforeTranslate

      const newWidthSeconds = width / pixelsPerSecond
      const maxDuration = asset?.duration ?? Infinity

      let invalid = false
      if (direction[0] === -1) {
        // finished resizing from left
        let newStart =
          origin.current.endSec -
          newWidthSeconds +
          translateX / pixelsPerSecond
        const clamped = Math.max(
          newStart,
          origin.current.endSec - maxDuration,
        )
        if (clamped !== newStart) invalid = true
        newStart = clamped
        if (snapTime !== null)
          newStart = Math.max(
            snapTime,
            origin.current.endSec - maxDuration,
          )
        updateClip(clip.id, { start: newStart })
      } else {
        // finished resizing from right
        let newEnd = origin.current.startSec + newWidthSeconds
        const clamped = Math.min(
          newEnd,
          origin.current.startSec + maxDuration,
        )
        if (clamped !== newEnd) invalid = true
        newEnd = clamped
        if (snapTime !== null)
          newEnd = Math.min(
            snapTime,
            origin.current.startSec + maxDuration,
          )
        updateClip(clip.id, { end: newEnd })
      }
      if (invalid) flashInvalid()
      setSnapTime(null)
    }

    // ------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------

    return (
      <>
        {snapTime !== null &&
          ref.current?.parentElement &&
          createPortal(
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent/60 pointer-events-none"
              style={{
                transform: `translateX(${snapTime * pixelsPerSecond}px)`,
              }}
            />,
            ref.current.parentElement,
          )}

        <Clip
          ref={ref}
          clip={clip}
          pixelsPerSecond={pixelsPerSecond}
          type={type}
        />

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
            // @ts-ignore
            onDragEnd={onDragEnd as unknown as (e: unknown) => void}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onResize={onResize as unknown as (e: unknown) => void}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onResizeEnd={onResizeEnd as unknown as (e: unknown) => void}
          />
        )}
      </>
    )
  },
)

InteractiveClip.displayName = 'InteractiveClip'
