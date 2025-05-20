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

export interface SegmentRange {
  start: number
  end: number
}

/**
 * Encode multiple segments sequentially and concatenate the results.
 * This helps keep memory usage in check for long videos.
 */
export const encodeWithSegments = async (
  file: File,
  ranges: SegmentRange[],
): Promise<Uint8Array> => {
  const ffmpeg = await getFFmpeg()
  if (typeof ffmpeg.load === 'function') {
    await ffmpeg.load()
  }

  const inputName = 'input.mp4'
  const inputBuffer = new Uint8Array(await file.arrayBuffer())
  if (ffmpeg.writeFile) {
    await ffmpeg.writeFile(inputName, inputBuffer)
  } else {
    ffmpeg.FS('writeFile', inputName, inputBuffer)
  }

  const segmentFiles: string[] = []
  for (let i = 0; i < ranges.length; i += 1) {
    const { start, end } = ranges[i]
    const segName = `seg_${i}.mp4`
    const args = ['-ss', `${start}`, '-to', `${end}`, '-i', inputName, '-c', 'copy', segName]
    if (ffmpeg.run) {
      await ffmpeg.run(...args)
    } else if (ffmpeg.exec) {
      await ffmpeg.exec(args)
    }
    segmentFiles.push(segName)
  }

  const listContent = segmentFiles.map((n) => `file '${n}'`).join('\n')
  const encoder = new TextEncoder()
  const listName = 'concat.txt'
  if (ffmpeg.writeFile) {
    await ffmpeg.writeFile(listName, encoder.encode(listContent))
  } else {
    ffmpeg.FS('writeFile', listName, encoder.encode(listContent))
  }

  const outName = 'output.mp4'
  const concatArgs = ['-f', 'concat', '-safe', '0', '-i', listName, '-c', 'copy', outName]
  if (ffmpeg.run) {
    await ffmpeg.run(...concatArgs)
  } else if (ffmpeg.exec) {
    await ffmpeg.exec(concatArgs)
  }

  const output = ffmpeg.readFile
    ? await ffmpeg.readFile(outName)
    : ffmpeg.FS
      ? ffmpeg.FS('readFile', outName)
      : new Uint8Array()

  const unlink = ffmpeg.unlink ? ffmpeg.unlink.bind(ffmpeg) : ffmpeg.FS?.bind(ffmpeg, 'unlink')
  if (unlink) {
    unlink(inputName)
    unlink(listName)
    unlink(outName)
    segmentFiles.forEach((s) => unlink(s))
  }

  return output
}
