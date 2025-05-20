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
import useMotifStore from '../lib/store'

/**
 * Export the entire timeline as a 1080p MP4 using ffmpeg.wasm.
 * Currently assumes all clips reference local assets with compatible codecs.
 */
export const exportTimelineVideo = async (): Promise<void> => {
  const { clipsById } = useTimelineStore.getState()
  const { mediaAssets, setExportStatus } = useMotifStore.getState()
  const clips = Object.values(clipsById).sort((a, b) => a.start - b.start)
  if (clips.length === 0) return

  setExportStatus(true, 0, null)

  try {
    const ffmpeg = await getFFmpeg()
    if (typeof ffmpeg.load === 'function') {
      await ffmpeg.load()
    }

    const segmentFiles: string[] = []
    const assetInputs = new Map<string, string>()
    let step = 0

    for (const clip of clips) {
      const asset = mediaAssets.find((a) => a.id === clip.assetId)
      if (!asset?.fileHandle) continue
      const inputName = assetInputs.get(asset.id) || `asset_${asset.id}.mp4`
      if (!assetInputs.has(asset.id)) {
        const file = await asset.fileHandle.getFile()
        await ffmpegWriteFile(ffmpeg, inputName, new Uint8Array(await file.arrayBuffer()))
        assetInputs.set(asset.id, inputName)
      }
      const segName = `seg_${segmentFiles.length}.mp4`
      await ffmpegExec(ffmpeg, ['-ss', String(clip.start), '-to', String(clip.end), '-i', inputName, '-c', 'copy', segName])
      segmentFiles.push(segName)
      step += 1
      setExportStatus(true, step / (clips.length + 1))
    }

    const listText = segmentFiles.map((f) => `file '${f}'`).join('\n')
    await ffmpegWriteFile(ffmpeg, 'concat.txt', new TextEncoder().encode(listText))

    attachProgressHandler(ffmpeg, (ratio) => {
      setExportStatus(true, (clips.length + ratio) / (clips.length + 1))
    })

    await ffmpegExec(ffmpeg, ['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-vf', 'scale=1920:1080', '-c:v', 'libx264', '-c:a', 'aac', '-movflags', 'faststart', 'output.mp4'])

    const data = await ffmpegReadFile(ffmpeg, 'output.mp4')

    ;['concat.txt', 'output.mp4', ...segmentFiles, ...assetInputs.values()].forEach((f) => ffmpegUnlink(ffmpeg, f))

    const blob = new Blob([data], { type: 'video/mp4' })
    if (typeof (window as any).showSaveFilePicker === 'function') {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'export.mp4',
          types: [{ description: 'MP4 Video', accept: { 'video/mp4': ['.mp4'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } catch (err) {
        console.warn('Save cancelled', err)
      }
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'export.mp4'
      a.click()
      URL.revokeObjectURL(url)
    }

    setExportStatus(false, 1, null)
  } catch (err: any) {
    console.error('Export failed', err)
    setExportStatus(false, 0, err?.message || 'Export failed')
  }
}
