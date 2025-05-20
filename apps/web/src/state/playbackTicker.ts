import { useEffect, useRef } from 'react'
import { useTransportStore } from './transportStore'

/**
 * Advance the playhead while playback is running.
 *
 * Runs a `requestAnimationFrame` loop throttled to roughly 30 fps and
 * calls `nudgeFrames` each tick according to the current play rate.
 */
export function usePlaybackTicker() {
  const playRate = useTransportStore((s) => s.playRate)
  const nudgeFrames = useTransportStore((s) => s.nudgeFrames)

  const rateRef = useRef(playRate)
  const nudgeRef = useRef(nudgeFrames)
  rateRef.current = playRate
  nudgeRef.current = nudgeFrames

  useEffect(() => {
    if (rateRef.current === 0) return
    let raf: number
    let timeout: number

    const loop = () => {
      nudgeRef.current(rateRef.current)
      timeout = window.setTimeout(() => {
        raf = requestAnimationFrame(loop)
      }, 1000 / 30)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
    }
  }, [playRate])
}
