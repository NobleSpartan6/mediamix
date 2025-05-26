import * as React from 'react'
import { useTimelineStore } from '../../state/timelineStore'
import { useTransportStore } from '../../state/transportStore'
import useMotifStore from '../../lib/store'
import { GPUEffectPipeline } from '../../gpu/effectsPipeline'
import { useClipsArray } from '../timeline/hooks/useClipsArray'
import { audioCtx } from '../../audioCtx'

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

  const audioRefs = React.useRef(
    new Map<
      string,
      { audio: HTMLAudioElement; node: MediaElementAudioSourceNode; url: string }
    >(),
  )

  React.useEffect(() => {
    const ctx = audioCtx
    if (!ctx) return
    let cancelled = false

    if (playRate !== 0 && ctx.state === 'suspended') {
      void ctx.resume()
    }

    const activeAudio: typeof clips = []
    if (activeClip) activeAudio.push(activeClip)
    activeAudio.push(
      ...clips.filter(
        (c) =>
          c.lane % 2 === 1 &&
          currentTime >= c.start &&
          currentTime < c.end &&
          !tracks[c.lane]?.muted,
      ),
    )

    const ids = new Set(activeAudio.map((c) => c.id))

    audioRefs.current.forEach((info, id) => {
      if (!ids.has(id)) {
        info.audio.pause()
        info.node.disconnect()
        URL.revokeObjectURL(info.url)
        audioRefs.current.delete(id)
      }
    })

    if (playRate <= 0 || Math.abs(playRate) > 2) {
      audioRefs.current.forEach((info) => info.audio.pause())
      return
    }

    activeAudio.forEach((clip) => {
      const existing = audioRefs.current.get(clip.id)
      const local = currentTime - clip.start
      if (existing) {
        existing.audio.playbackRate = playRate
        if (Math.abs(existing.audio.currentTime - local) > 0.05) {
          existing.audio.currentTime = local
        }
        if (existing.audio.paused) void existing.audio.play()
        return
      }
      const asset = mediaAssets.find((a) => a.id === clip.assetId)
      if (!asset?.fileHandle) return
      asset.fileHandle.getFile().then((file) => {
        if (cancelled) return
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)
        audio.muted = true
        const node = ctx.createMediaElementSource(audio)
        node.connect(ctx.destination)
        audio.onloadedmetadata = () => {
          audio.currentTime = local
          audio.playbackRate = playRate
          void audio.play()
        }
        audioRefs.current.set(clip.id, { audio, node, url })
      })
    })
    return () => {
      cancelled = true
    }
  }, [currentTime, playRate, tracks])

  return (
    <div className="w-full bg-black aspect-video mb-4 relative">
      <video ref={videoRef} className="w-full h-full" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  )
})

VideoPreview.displayName = 'VideoPreview'

export default VideoPreview
