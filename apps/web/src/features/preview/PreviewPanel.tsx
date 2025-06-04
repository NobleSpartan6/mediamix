import * as React from 'react'
import { useClipsArray } from '../timeline/hooks/useClipsArray'
import { useTimelineStore } from '../../state/timelineStore'
import { useTransportStore } from '../../state/transportStore'
import { useMediaStore } from '../../state/mediaStore'

// Helper to format seconds as HH:MM:SS.FF at 30fps
const formatTimecode = (seconds: number) => {
  const fps = 30
  const totalFrames = Math.round(seconds * fps)
  const frames = totalFrames % fps
  const totalSeconds = Math.floor(totalFrames / fps)
  const secs = totalSeconds % 60
  const mins = Math.floor(totalSeconds / 60) % 60
  const hrs = Math.floor(totalSeconds / 3600)
  const pad = (n: number, l = 2) => n.toString().padStart(l, '0')
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(frames)}`
}

/**
 * Preview panel showing the active timeline clip with transport controls.
 */
export const PreviewPanel: React.FC = React.memo(() => {
  const clips = useClipsArray()
  const currentTime = useTimelineStore((s) => s.currentTime)
  const playRate = useTransportStore((s) => s.playRate)
  const setPlayRate = useTransportStore((s) => s.setPlayRate)
  const assets = useMediaStore((s) => s.assets)

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = React.useState(true)
  const [showControls, setShowControls] = React.useState(true)
  const hideTimeout = React.useRef<number | null>(null)

  const handleMouseMove = React.useCallback(() => {
    setShowControls(true)
    if (hideTimeout.current) window.clearTimeout(hideTimeout.current)
    hideTimeout.current = window.setTimeout(() => setShowControls(false), 1500)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    if (hideTimeout.current) window.clearTimeout(hideTimeout.current)
    setShowControls(false)
  }, [])

  const playing = playRate !== 0

  // Active clip for current time (video lanes are even indices)
  const sortedClips = React.useMemo(
    () => clips.filter((c) => c.lane % 2 === 0).sort((a, b) => a.start - b.start),
    [clips],
  )
  const activeClip = React.useMemo(
    () =>
      sortedClips.find((c) => currentTime >= c.start && currentTime < c.end) || null,
    [sortedClips, currentTime],
  )

  // Load the active clip file into the video element
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !activeClip) return
    const asset = assets[activeClip.assetId ?? '']
    if (!asset?.fileHandle) return
    let url: string | null = null
    asset.fileHandle.getFile().then((file) => {
      url = URL.createObjectURL(file)
      video.src = url
      video.onloadedmetadata = () => {
        video.currentTime = currentTime - activeClip.start
        if (playing) {
          video.playbackRate = Math.abs(playRate)
          void video.play()
        }
        video.muted = muted
      }
    })
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [activeClip])

  // Sync currentTime while scrubbing or during playback
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !activeClip) return
    const localTime = currentTime - activeClip.start
    if (Math.abs(video.currentTime - localTime) > 0.05) {
      video.currentTime = localTime
    }
  }, [currentTime, activeClip])

  // Play/pause handling
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !activeClip) return
    if (playRate === 0) {
      video.pause()
    } else {
      video.playbackRate = Math.abs(playRate)
      void video.play()
    }
  }, [playRate, activeClip])

  // Drop quality during fast scrubbing
  const lastTime = React.useRef(currentTime)
  const qualityTimeout = React.useRef<number | null>(null)
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const delta = Math.abs(currentTime - lastTime.current)
    lastTime.current = currentTime
    if (playRate === 0 && delta > 0.5) {
      video.playbackRate = 4
      if (qualityTimeout.current) window.clearTimeout(qualityTimeout.current)
      qualityTimeout.current = window.setTimeout(() => {
        video.playbackRate = 1
      }, 200)
    }
  }, [currentTime, playRate])

  React.useEffect(() => {
    const video = videoRef.current
    if (video) video.muted = muted
  }, [muted])

  const togglePlay = React.useCallback(() => {
    setPlayRate(playing ? 0 : 1)
  }, [playing, setPlayRate])

  const toggleMute = React.useCallback(() => {
    setMuted((m) => !m)
  }, [])

  const enterFullscreen = React.useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.requestFullscreen) {
      void el.requestFullscreen()
    } else if ((el as any).webkitRequestFullscreen) {
      ;(el as any).webkitRequestFullscreen()
    }
  }, [])

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />
      {showControls && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-4 text-xs bg-black/60 px-2 py-1 fade-in show">
          <button
            type="button"
            onClick={togglePlay}
            className="px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel-bg"
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <span className="font-mono">{formatTimecode(currentTime)}</span>
          <button
            type="button"
            onClick={toggleMute}
            className="px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel-bg"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            onClick={enterFullscreen}
            className="px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel-bg"
          >
            ⛶
          </button>
        </div>
      )}
    </div>
  )
})

PreviewPanel.displayName = 'PreviewPanel'

export default PreviewPanel
