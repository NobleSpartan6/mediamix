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


// Helpers adapted from the audio extraction worker for cross-version support
async function ffmpegWriteFile(ffmpeg: any, name: string, data: Uint8Array) {
  if (typeof ffmpeg.FS === 'function') {
    ffmpeg.FS('writeFile', name, data)
  } else if (typeof ffmpeg.writeFile === 'function') {
    await ffmpeg.writeFile(name, data)
  } else {
    throw new Error('writeFile unsupported')
  }
}

async function ffmpegReadFile(ffmpeg: any, name: string): Promise<Uint8Array> {
  if (typeof ffmpeg.FS === 'function') {
    return ffmpeg.FS('readFile', name)
  }
  if (typeof ffmpeg.readFile === 'function') {
    return ffmpeg.readFile(name)
  }
  throw new Error('readFile unsupported')
}

function ffmpegUnlink(ffmpeg: any, name: string) {
  try {
    if (typeof ffmpeg.FS === 'function') {
      ffmpeg.FS('unlink', name)
    } else if (typeof ffmpeg.unlink === 'function') {
      ffmpeg.unlink(name)
    }
  } catch {
    // ignore
  }
}

function attachProgressHandler(ffmpeg: any, cb: (ratio: number) => void) {
  if (typeof ffmpeg.setProgress === 'function') {
    ffmpeg.setProgress(({ ratio }: { ratio: number }) => cb(ratio))
  } else if (typeof ffmpeg.on === 'function') {
    ffmpeg.on('progress', ({ progress }: { progress: number }) => cb(progress))
  }
}

async function ffmpegExec(ffmpeg: any, args: string[]) {
  if (typeof ffmpeg.run === 'function') {
    await ffmpeg.run(...args)
  } else if (typeof ffmpeg.exec === 'function') {
    await ffmpeg.exec(args)
  } else {
    throw new Error('run/exec unsupported')
  }
}

import { useTimelineStore } from '../state/timelineStore'
import { useTransportStore } from '../state/transportStore'
import useMotifStore from '../lib/store'
import { audioCtx } from '../audioCtx'
import { toast } from '../components/Toast'

/**
 * Export the timeline preview + audio to a WebM file via MediaRecorder.
 */
export const exportTimelineVideo = async (): Promise<void> => {
  const timeline = useTimelineStore.getState()
  const transport = useTransportStore.getState()
  const { setExportStatus } = useMotifStore.getState()

  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
  if (!canvas || !audioCtx) return

  const canvasStream = canvas.captureStream(30)
  const audioStream = audioCtx.destination.stream
  const combined = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ])
  const recorder = new MediaRecorder(combined, {
    mimeType: 'video/webm;codecs=vp8,opus',
  })

  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const { setCurrentTime, inPoint, outPoint, durationSec, currentTime } = timeline
  const { setPlayRate } = transport
  const originalFrame = transport.playheadFrame
  const originalRate = transport.playRate
  const originalTime = currentTime
  const startTime = inPoint ?? 0
  const endTime = outPoint ?? durationSec

  useTransportStore.setState({ playheadFrame: Math.floor(startTime * 30) })
  setCurrentTime(startTime)

  setExportStatus(true, 0, null)

  recorder.start()

  setPlayRate(1)

  await new Promise<void>((resolve) => {
    const interval = window.setInterval(() => {
      const cur = useTimelineStore.getState().currentTime
      const progress = (cur - startTime) / (endTime - startTime)
      setExportStatus(true, Math.max(0, Math.min(progress, 1)), null)

      if (useTransportStore.getState().playRate === 0 || cur >= endTime) {
        clearInterval(interval)
        recorder.stop()
      }
    }, 200)

    recorder.onstop = () => {
      clearInterval(interval)
      resolve()
    }
  })

  setPlayRate(originalRate)
  useTransportStore.setState({ playheadFrame: originalFrame })
  setCurrentTime(originalTime)

  const blob = new Blob(chunks, { type: 'video/webm' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'MediaMixExport.webm'
  a.click()
  URL.revokeObjectURL(url)

  setExportStatus(false, 1, null)
  toast('Export complete')
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
