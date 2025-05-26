import { useEffect, useRef } from 'react'
import { useTransportStore } from './transportStore'
import { useTimelineStore } from './timelineStore'

/**
 * Advance the playhead while playback is running.
 *
 * Runs a `requestAnimationFrame` loop throttled to roughly 30 fps and
 * calls `nudgeFrames` each tick according to the current play rate.
 */
export function usePlaybackTicker() {
  const playRate = useTransportStore((s) => s.playRate)
  const nudgeFrames = useTransportStore((s) => s.nudgeFrames)
  const setPlayRate = useTransportStore((s) => s.setPlayRate)
  const outPoint = useTimelineStore((s) => s.outPoint)

  const rateRef = useRef(playRate)
  const nudgeRef = useRef(nudgeFrames)
  const outRef = useRef(outPoint)
  const setRateRef = useRef(setPlayRate)
  rateRef.current = playRate
  nudgeRef.current = nudgeFrames
  outRef.current = outPoint
  setRateRef.current = setPlayRate

  useEffect(() => {
    if (rateRef.current === 0) return
    let raf: number
    let timeout: number

    const loop = () => {
      nudgeRef.current(rateRef.current)
      const frame = useTransportStore.getState().playheadFrame
      const out = outRef.current
      if (out !== null && frame / 30 >= out) {
        const clamped = Math.floor(out * 30)
        useTransportStore.setState({ playheadFrame: clamped })
        setRateRef.current(0)
        rateRef.current = 0
        return
      }
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
