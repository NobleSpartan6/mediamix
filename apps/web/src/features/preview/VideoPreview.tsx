import * as React from 'react'
import { useTimelineStore } from '../../state/timelineStore'
import { useTransportStore } from '../../state/transportStore'
import useMotifStore from '../../lib/store'

/**
 * Simple video preview synced to the timeline playhead.
 *
 * For now we render the first imported media asset and
 * seek the video element as the playhead moves.
 */
export const VideoPreview: React.FC = React.memo(() => {
  const currentTime = useTimelineStore((s) => s.currentTime)
  const playRate = useTransportStore((s) => s.playRate)
  const mediaAssets = useMotifStore((s) => s.mediaAssets)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Load the first asset's file into the video element
  React.useEffect(() => {
    const asset = mediaAssets[0]
    if (!asset?.fileHandle) return
    let url: string | null = null
    asset.fileHandle.getFile().then((file) => {
      url = URL.createObjectURL(file)
      if (videoRef.current) {
        videoRef.current.src = url
      }
    })
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [mediaAssets])

  // Sync currentTime when playhead moves
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (Math.abs(video.currentTime - currentTime) > 0.05) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  // Play/pause according to playRate
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playRate === 0) {
      video.pause()
    } else {
      video.playbackRate = Math.abs(playRate)
      void video.play()
    }
  }, [playRate])

  return (
    <div className="w-full bg-black aspect-video mb-4">
      <video ref={videoRef} className="w-full h-full" muted playsInline />
    </div>
  )
})

VideoPreview.displayName = 'VideoPreview'

export default VideoPreview
