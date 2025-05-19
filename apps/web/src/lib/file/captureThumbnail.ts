export function captureThumbnail(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoFile)
    const video = document.createElement('video')
    const cleanup = () => URL.revokeObjectURL(url)
    video.muted = true
    video.playsInline = true
    video.src = url
    video.addEventListener('loadeddata', () => {
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
      resolve(data)
    })
    video.addEventListener('error', () => {
      cleanup()
      reject(new Error('Video load error'))
    })
  })
}
