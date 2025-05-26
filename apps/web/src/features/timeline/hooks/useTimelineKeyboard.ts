import { useEffect, useRef } from 'react'
import { useTransportStore } from '../../../state/transportStore'
import { useTimelineStore } from '../../../state/timelineStore'

/**
 * Installs global key listeners for shuttle (J/K/L) and jog (←/→) actions.
 * Listeners are attached to `window`, so shortcuts work regardless of focus.
 * Call inside the Timeline component – it automatically cleans up on unmount.
 */
export function useTimelineKeyboard() {
  const stepShuttle   = useTransportStore((s) => s.stepShuttle)
  const setPlayRate   = useTransportStore((s) => s.setPlayRate)
  const nudgeFrames   = useTransportStore((s) => s.nudgeFrames)
  const playheadFrame = useTransportStore((s) => s.playheadFrame)

  const setInPoint    = useTimelineStore((s) => s.setInPoint)
  const setOutPoint   = useTimelineStore((s) => s.setOutPoint)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const splitClipAt   = useTimelineStore((s) => s.splitClipAt)
  const removeClip    = useTimelineStore((s) => s.removeClip)
  const selectedIds   = useTimelineStore((s) => s.selectedClipIds)
  const setSelected   = useTimelineStore((s) => s.setSelectedClips)

  /** Refs prevent stale closures during rapid key-repeat */
  const stepRef     = useRef(stepShuttle)
  const setRateRef  = useRef(setPlayRate)
  const nudgeRef    = useRef(nudgeFrames)
  const playheadRef = useRef(playheadFrame)
  const inRef       = useRef(setInPoint)
  const outRef      = useRef(setOutPoint)
  const splitRef    = useRef(splitClipAt)
  const removeRef   = useRef(removeClip)
  const selectedRef = useRef(selectedIds)
  const setSelRef   = useRef(setSelected)
  const setCurrentRef = useRef(setCurrentTime)

  /* Keep refs fresh each render */
  useEffect(() => {
    stepRef.current     = stepShuttle
    setRateRef.current  = setPlayRate
    nudgeRef.current    = nudgeFrames
    playheadRef.current = playheadFrame
    inRef.current       = setInPoint
    outRef.current      = setOutPoint
    splitRef.current    = splitClipAt
    removeRef.current   = removeClip
    selectedRef.current = selectedIds
    setSelRef.current   = setSelected
    setCurrentRef.current = setCurrentTime
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'l':
        case 'L':
          stepRef.current(1)
          e.preventDefault()
          break
        case 'j':
        case 'J':
          stepRef.current(-1)
          e.preventDefault()
          break
        case 'k':
        case 'K':
          setRateRef.current(0)
          e.preventDefault()
          break
        case ' ': {
          const rate = useTransportStore.getState().playRate
          if (rate === 0) {
            const inPt = useTimelineStore.getState().inPoint
            const cur = useTimelineStore.getState().currentTime
            if (inPt !== null && cur < inPt) {
              const frame = Math.floor(inPt * 30)
              useTransportStore.setState({ playheadFrame: frame })
              setCurrentRef.current(inPt)
            }
          }
          setRateRef.current(rate === 0 ? 1 : 0)
          e.preventDefault()
          break
        }
        case 'ArrowRight':
          nudgeRef.current(e.shiftKey ? 10 : 1)
          e.preventDefault()
          break
        case 'ArrowLeft':
          nudgeRef.current(e.shiftKey ? -10 : -1)
          e.preventDefault()
          break
        case 'i':
        case 'I': {
          playheadRef.current = useTransportStore.getState().playheadFrame
          if (e.shiftKey) {
            inRef.current(null)
          } else {
            inRef.current(playheadRef.current / 30)
          }
          e.preventDefault()
          break
        }
        case 'o':
        case 'O': {
          playheadRef.current = useTransportStore.getState().playheadFrame
          if (e.shiftKey) {
            outRef.current(null)
          } else {
            outRef.current(playheadRef.current / 30)
          }
          e.preventDefault()
          break
        }
        case 'c':
        case 'C': {
          playheadRef.current = useTransportStore.getState().playheadFrame
          splitRef.current(playheadRef.current / 30)
          e.preventDefault()
          break
        }
        case 'Delete':
        case 'Backspace': {
          selectedRef.current.forEach((id) => removeRef.current(id))
          if (selectedRef.current.length > 0) setSelRef.current([])
          e.preventDefault()
          break
        }
        default:
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

