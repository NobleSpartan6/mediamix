let createFFmpegFn: any

// Lazily import ffmpeg to play nicely with test mocks
const getFFmpeg = async () => {
  if (!createFFmpegFn) {
    const mod = await import('@ffmpeg/ffmpeg')
    createFFmpegFn = mod.createFFmpeg
  }
  return createFFmpegFn({
    log: false,
    corePath: `${globalThis.location?.origin || ''}/ffmpeg-core.js`,
  })
}

/**
 * Export a portion of a video using ffmpeg.wasm.
 */
export const segmentVideo = async (file: File, start: number, end: number): Promise<Uint8Array> => {
  const ffmpeg = await getFFmpeg()
  if (typeof ffmpeg.load === 'function') {
    await ffmpeg.load()
  }
  const inputName = 'input.mp4'
  const outputName = 'segment.mp4'
  const buffer = typeof (file as any).arrayBuffer === 'function'
    ? await (file as any).arrayBuffer()
    : new ArrayBuffer(0)
  const data = new Uint8Array(buffer)
  if (ffmpeg.writeFile) {
    await ffmpeg.writeFile(inputName, data)
  } else {
    ffmpeg.FS('writeFile', inputName, data)
  }
  const args = ['-ss', `${start}`, '-to', `${end}`, '-i', inputName, '-c', 'copy', outputName]
  if (ffmpeg.run) {
    await ffmpeg.run(...args)
  } else if (ffmpeg.exec) {
    await ffmpeg.exec(args)
  }
  const output = ffmpeg.readFile
    ? await ffmpeg.readFile(outputName)
    : ffmpeg.FS
      ? ffmpeg.FS('readFile', outputName)
      : new Uint8Array()
  if (ffmpeg.unlink) {
    await ffmpeg.unlink(inputName)
    await ffmpeg.unlink(outputName)
  } else {
    ffmpeg.FS('unlink', inputName)
    ffmpeg.FS('unlink', outputName)
  }
  return output
}
