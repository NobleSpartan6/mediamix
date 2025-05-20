import type { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpegInstance: FFmpeg | null = null

interface TranscodeMsg {
  type: 'TRANSCODE'
  payload: {
    file: File
  }
}
interface ProgressMsg { type: 'PROGRESS'; progress: number }
interface DoneMsg { type: 'DONE'; data: ArrayBuffer }
interface ErrorMsg { type: 'ERROR'; error: string }

type WorkerMsg = TranscodeMsg

declare const self: Worker & typeof globalThis

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance
  const mod = (await import('@ffmpeg/ffmpeg')) as any
  if (mod.createFFmpeg) {
    ffmpegInstance = mod.createFFmpeg({
      log: false,
      corePath: `${self.location.origin}/ffmpeg-core.js`,
    }) as FFmpeg
  } else if (mod.FFmpeg) {
    ffmpegInstance = new mod.FFmpeg() as FFmpeg
  } else {
    throw new Error('FFmpeg module not found')
  }
  if (typeof (ffmpegInstance as any).load === 'function') {
    await (ffmpegInstance as any).load()
  }
  return ffmpegInstance
}

async function writeFile(ff: any, name: string, data: Uint8Array) {
  if (typeof ff.FS === 'function') ff.FS('writeFile', name, data)
  else if (typeof ff.writeFile === 'function') await ff.writeFile(name, data)
  else throw new Error('writeFile not supported')
}
async function readFile(ff: any, name: string): Promise<Uint8Array> {
  if (typeof ff.FS === 'function') return ff.FS('readFile', name)
  if (typeof ff.readFile === 'function') return ff.readFile(name)
  throw new Error('readFile not supported')
}
function unlink(ff: any, name: string) {
  try {
    if (typeof ff.FS === 'function') ff.FS('unlink', name)
    else if (typeof ff.unlink === 'function') ff.unlink(name)
  } catch {
    /* ignore */
  }
}
function attachProgress(ff: any, cb: (n: number) => void) {
  if (typeof ff.setProgress === 'function') ff.setProgress(({ ratio }: any) => cb(ratio))
  else if (typeof ff.on === 'function') ff.on('progress', ({ progress }: any) => cb(progress))
}
async function exec(ff: any, args: string[]) {
  if (typeof ff.run === 'function') await ff.run(...args)
  else if (typeof ff.exec === 'function') await ff.exec(args)
  else throw new Error('run/exec not supported')
}

self.onmessage = async (e: MessageEvent<WorkerMsg>) => {
  const { type, payload } = e.data
  if (type !== 'TRANSCODE') return
  const { file } = payload
  if (!file) {
    self.postMessage({ type: 'ERROR', error: 'No file provided' } as ErrorMsg)
    return
  }
  try {
    const ff = await getFFmpeg()
    const input = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const output = 'proxy.mp4'
    await writeFile(ff, input, new Uint8Array(await file.arrayBuffer()))

    const args = [
      '-i', input,
      '-vf', 'scale=-2:720',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      output,
    ]

    attachProgress(ff, (p) => {
      const msg: ProgressMsg = { type: 'PROGRESS', progress: Math.max(0, Math.min(1, p)) }
      self.postMessage(msg)
    })
    await exec(ff, args)
    const data = await readFile(ff, output)
    const buf = data.buffer.slice(0)
    const done: DoneMsg = { type: 'DONE', data: buf }
    self.postMessage(done, [buf])
    unlink(ff, input)
    unlink(ff, output)
  } catch (err: any) {
    const msg: ErrorMsg = { type: 'ERROR', error: err?.message || 'Proxy transcode failed' }
    self.postMessage(msg)
  }
}
