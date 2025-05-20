import * as React from 'react'
import { useTimelineStore } from '../../state/timelineStore'
import { useTransportStore } from '../../state/transportStore'
import useMotifStore from '../../lib/store'
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
  const playRate = useTransportStore((s) => s.playRate)
  const mediaAssets = useMotifStore((s) => s.mediaAssets)
  const clips = useClipsArray()
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Sort video clips by start time (lane even => video)
  const sortedClips = React.useMemo(
    () =>
      clips
        .filter((c) => c.lane % 2 === 0)
        .sort((a, b) => a.start - b.start),
    [clips],
  )

  // Determine active clip for the current time
  const activeClip = React.useMemo(
    () =>
      sortedClips.find((c) => currentTime >= c.start && currentTime < c.end) ||
      null,
    [sortedClips, currentTime],
  )

  // Load the clip's media into the video element
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !activeClip) return
    const asset = mediaAssets.find((a) => a.id === activeClip.assetId)
    if (!asset?.fileHandle) return
    let url: string | null = null
    let cancelled = false

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
      }
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
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
    <div className="w-full bg-black aspect-video mb-4">
      <video ref={videoRef} className="w-full h-full" muted playsInline />
    </div>
  )
})

VideoPreview.displayName = 'VideoPreview'

export default VideoPreview
