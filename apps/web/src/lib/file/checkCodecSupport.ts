export interface CodecSupportResult {
  videoSupported: boolean | null
  audioSupported: boolean | null
}

/**
 * Check browser codec support using the WebCodecs API. Returns null values when
 * WebCodecs is not available (e.g. on Safari <16 or Firefox at time of writing).
 *
 * Note: We intentionally use broadly-compatible codec strings for the demo.
 * Real-world production code should derive the codec strings from the actual
 * container/track metadata (e.g. using ISO BMFF parsing or `MediaCapabilities`).
 */
export async function checkCodecSupport({
  width = 1920,
  height = 1080,
  sampleRate = 48000,
  channelCount = 2,
}: {
  width?: number | null
  height?: number | null
  sampleRate?: number | null
  channelCount?: number | null
} = {}): Promise<CodecSupportResult> {
  // Guard: WebCodecs not available
  const hasVideoDecoder = typeof window !== 'undefined' && 'VideoDecoder' in window
  const hasAudioDecoder = typeof window !== 'undefined' && 'AudioDecoder' in window

  if (!hasVideoDecoder && !hasAudioDecoder) {
    return {
      videoSupported: null,
      audioSupported: null,
    }
  }

  let videoSupported: boolean | null = null
  let audioSupported: boolean | null = null

  try {
    if (hasVideoDecoder && typeof (window as any).VideoDecoder?.isConfigSupported === 'function') {
      // Test a shortlist of common video codecs: H.264 Baseline/Main & H.265/HEVC
      const videoCandidates = [
        'avc1.42E01E', // H.264 Baseline
        'avc1.640028', // H.264 High
        'hev1.1.6.L93.B0', // HEVC Main
        'hvc1.1.6.L93.B0', // HEVC Main (alias)
      ]

      for (const codec of videoCandidates) {
        try {
          // Width & height are required in most user agents
          const support = await (window as any).VideoDecoder.isConfigSupported({
            codec,
            width: width ?? 1920,
            height: height ?? 1080,
          })
          if (support?.supported) {
            videoSupported = true
            break
          }
        } catch {
          /* ignore individual codec errors */
        }
      }

      if (videoSupported === null) videoSupported = false
    }
  } catch {
    videoSupported = null
  }

  try {
    if (hasAudioDecoder && typeof (window as any).AudioDecoder?.isConfigSupported === 'function') {
      const audioCandidates = [
        'mp4a.40.2', // AAC LC
        'mp3', // MP3
        'opus', // Opus
      ]

      for (const codec of audioCandidates) {
        try {
          const support = await (window as any).AudioDecoder.isConfigSupported({
            codec,
            sampleRate: sampleRate ?? 48000,
            numberOfChannels: channelCount ?? 2,
          })
          if (support?.supported) {
            audioSupported = true
            break
          }
        } catch {
          /* ignore individual codec errors */
        }
      }

      if (audioSupported === null) audioSupported = false
    }
  } catch {
    audioSupported = null
  }

  return { videoSupported, audioSupported }
} 