export interface VideoMetadata {
  duration: number | null
  width: number | null
  height: number | null
  videoCodec: string | null
  audioCodec: string | null
  frameRate: number | null
  sampleRate: number | null
  channelCount: number | null
}

/**
 * Extract basic metadata (duration, dimensions, codecs) from a video File.
 * Relies purely on browser-native capabilities to remain within the hard stack-lock.
 *
 * Returns `null` if the browser cannot load the file.
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata | null> {
  return new Promise((resolve) => {
    // Guard: if running in a non-browser context just resolve null
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    const video = document.createElement('video')
    // Ensure the element never becomes visible / added to layout
    video.style.display = 'none'
    video.preload = 'metadata'

    // blob URL so we don't request remote resources
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl

    const cleanUp = () => {
      URL.revokeObjectURL(objectUrl)
      video.remove()
    }

    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: isFinite(video.duration) ? video.duration : null,
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        // Very rough heuristic – use MIME container as stand-in for codec.
        // TODO(tauri-port): Replace with real codec parsing via mp4box or WebCodecs parser once allowed.
        videoCodec: file.type || null,
        audioCodec: null, // Browser APIs do not expose this without parsing – left null for now.
        frameRate: null,
        sampleRate: null,
        channelCount: null
      }
      cleanUp()
      resolve(metadata)
    }

    // Handle error / unsupported formats gracefully
    video.onerror = () => {
      cleanUp()
      resolve(null)
    }

    // Append temporarily so the browser can start loading metadata.
    // We add to body to ensure stable behaviour across browsers.
    document.body.appendChild(video)
  })
} 