import { cacheKeyForFile } from './cacheKey'
import { getCachedAnalysis, setCachedAnalysis } from '../cache'

export async function captureThumbnail(
  videoFile: File,
  ratio = 0.5,
): Promise<string> {
  const key = `${cacheKeyForFile(videoFile)}-thumb-${ratio}`
  const cached = await getCachedAnalysis<string>(key)
  if (cached) return cached

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoFile)
    const video = document.createElement('video')
    const cleanup = () => URL.revokeObjectURL(url)
    video.muted = true
    video.playsInline = true
    video.src = url
    video.addEventListener('loadedmetadata', () => {
      try {
        video.currentTime = video.duration * ratio
      } catch {
        /* fall back to first frame */
      }
    })
    const capture = () => {
      const canvas = document.createElement('canvas')
      const w = video.videoWidth || 160
      const h = video.videoHeight || 90
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        cleanup()
        reject(new Error('Canvas 2D not available'))
        return
      }
      ctx.drawImage(video, 0, 0, w, h)
      const data = canvas.toDataURL('image/png')
      cleanup()
      setCachedAnalysis(key, data).catch(() => {})
      resolve(data)
    }
    video.addEventListener('seeked', capture)
    video.addEventListener('loadeddata', capture)
    video.addEventListener('error', () => {
      cleanup()
      reject(new Error('Video load error'))
    })
  })
}
