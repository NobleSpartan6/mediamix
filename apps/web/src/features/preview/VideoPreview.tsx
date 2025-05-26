import * as React from 'react'
import { useTimelineStore } from '../../state/timelineStore'
import { useTransportStore } from '../../state/transportStore'
import useMotifStore from '../../lib/store'
import { GPUEffectPipeline } from '../../gpu/effectsPipeline'
import { useClipsArray } from '../timeline/hooks/useClipsArray'

/**
 * Video preview synchronized with the timeline playhead.
 *
 * Plays timeline clips sequentially by switching the video source
 * at clip boundaries. Scrubbing the timeline updates the preview
 * and playback rate is mirrored from the transport store.
 */
export const VideoPreview: React.FC = React.memo(() => {
  const currentTime = useTimelineStore((s) => s.currentTime)
  const tracks = useTimelineStore((s) => s.tracks)
  const playRate = useTransportStore((s) => s.playRate)
  const mediaAssets = useMotifStore((s) => s.mediaAssets)
  const clips = useClipsArray()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const pipelineRef = React.useRef<GPUEffectPipeline | null>(null)

  // Initialise GPU pipeline if available
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (typeof WebGL2RenderingContext !== 'undefined' && canvas.getContext('webgl2')) {
      pipelineRef.current = new GPUEffectPipeline(canvas)
    }
  }, [])

  // Sort video clips by start time (lane even => video)
  const sortedClips = React.useMemo(
    () =>
      clips
        .filter((c) => c.lane % 2 === 0 && !tracks[c.lane]?.muted)
        .sort((a, b) => a.start - b.start),
    [clips, tracks],
  )

  // Determine active clip for the current time
  const activeClip = React.useMemo(
    () =>
      sortedClips.find((c) => currentTime >= c.start && currentTime < c.end) ||
      null,
    [sortedClips, currentTime],
  )

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!activeClip) {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [activeClip])

  // Load the clip's media into the video element and render via GPU pipeline
  React.useEffect(() => {
    const video = videoRef.current
    const pipeline = pipelineRef.current
    if (!video || !activeClip) return
    const asset = mediaAssets.find((a) => a.id === activeClip.assetId)
    if (!asset?.fileHandle) return
    let url: string | null = null
    let cancelled = false
    let raf = 0

    asset.fileHandle.getFile().then((file) => {
      if (cancelled) return
      url = URL.createObjectURL(file)
      video.src = url
      video.onloadedmetadata = () => {
        video.currentTime = currentTime - activeClip.start
        if (playRate !== 0) {
          video.playbackRate = Math.abs(playRate)
          void video.play()
        }
        const draw = () => {
          if (pipeline) {
            pipeline.apply(video, 'passthrough')
            raf = requestAnimationFrame(draw)
          }
        }
        if (pipeline) raf = requestAnimationFrame(draw)
      }
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [activeClip, mediaAssets, currentTime, playRate])

  // Sync currentTime when playhead moves within the same clip
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !activeClip) return
    const localTime = currentTime - activeClip.start
    if (Math.abs(video.currentTime - localTime) > 0.05) {
      video.currentTime = localTime
    }
  }, [currentTime, activeClip])

  // Play/pause according to playRate
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

  return (
    <div className="w-full bg-black aspect-video mb-4 relative">
      <video ref={videoRef} className="w-full h-full" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  )
})

VideoPreview.displayName = 'VideoPreview'

export default VideoPreview
