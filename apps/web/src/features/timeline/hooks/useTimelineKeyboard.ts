import { useEffect, useRef } from 'react'
import { useTransportStore } from '../../../state/transportStore'

/**
 * Hook that installs global key listeners for shuttle (J/K/L) and jog (←/→)
actions. The listeners are attached to `window`, so shortcuts work
 * regardless of focus. Attach by calling inside the Timeline component – it
 * automatically cleans up on unmount.
 */
export function useTimelineKeyboard() {
  const stepShuttle = useTransportStore((s) => s.stepShuttle)
  const setPlayRate = useTransportStore((s) => s.setPlayRate)
  const nudgeFrames = useTransportStore((s) => s.nudgeFrames)

  // Using ref to prevent stale closures during rapid key repeat
  const stepRef = useRef(stepShuttle)
  const setRateRef = useRef(setPlayRate)
  const nudgeRef = useRef(nudgeFrames)
  stepRef.current = stepShuttle
  setRateRef.current = setPlayRate
  nudgeRef.current = nudgeFrames

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
        case 'ArrowRight':
          nudgeRef.current(e.shiftKey ? 10 : 1)
          e.preventDefault()
          break
        case 'ArrowLeft':
          nudgeRef.current(e.shiftKey ? -10 : -1)
          e.preventDefault()
          break
        default:
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
} 
