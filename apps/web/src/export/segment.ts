import { FFmpeg } from '@ffmpeg/ffmpeg'

// Lazily import ffmpeg to play nicely with test mocks
const getFFmpeg = async () => {
  const ffmpeg = new FFmpeg()
  return ffmpeg
}

/**
 * Export a portion of a video using ffmpeg.wasm.
 */
export const segmentVideo = async (file: File, start: number, end: number): Promise<Uint8Array> => {
  const ffmpeg = await getFFmpeg()
  await ffmpeg.load()

  const inputName = 'input.mp4'
  const outputName = 'segment.mp4'
  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)
  
  await ffmpeg.writeFile(inputName, data)
  const args = ['-ss', `${start}`, '-to', `${end}`, '-i', inputName, '-c', 'copy', outputName]
  await ffmpeg.exec(args)
  const output = await ffmpeg.readFile(outputName)
  
  // Clean up
  try {
    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
  } catch {
    // Ignore cleanup errors
  }

  return output as Uint8Array
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
  // Create an audio stream from the audio context
  const mediaStreamDestination = audioCtx.createMediaStreamDestination()
  audioCtx.destination.connect?.(mediaStreamDestination)
  const audioStream = mediaStreamDestination.stream
  const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()])
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
export const encodeWithSegments = async (file: File, ranges: SegmentRange[]): Promise<Uint8Array> => {
  const ffmpeg = await getFFmpeg()
  await ffmpeg.load()

  const inputName = 'input.mp4'
  const inputBuffer = new Uint8Array(await file.arrayBuffer())
  await ffmpeg.writeFile(inputName, inputBuffer)

  const segmentFiles: string[] = []
  for (let i = 0; i < ranges.length; i += 1) {
    const { start, end } = ranges[i]
    const segName = `seg_${i}.mp4`
    const args = ['-ss', `${start}`, '-to', `${end}`, '-i', inputName, '-c', 'copy', segName]
    await ffmpeg.exec(args)
    segmentFiles.push(segName)
  }

  const listContent = segmentFiles.map((n) => `file '${n}'`).join('\n')
  const encoder = new TextEncoder()
  const listName = 'concat.txt'
  await ffmpeg.writeFile(listName, encoder.encode(listContent))

  const outName = 'output.mp4'
  const concatArgs = ['-f', 'concat', '-safe', '0', '-i', listName, '-c', 'copy', outName]
  await ffmpeg.exec(concatArgs)

  const output = await ffmpeg.readFile(outName)

  // Clean up files
  try {
    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(listName)
    await ffmpeg.deleteFile(outName)
    for (const segFile of segmentFiles) {
      await ffmpeg.deleteFile(segFile)
    }
  } catch {
    // Ignore cleanup errors
  }

  return output as Uint8Array
}
