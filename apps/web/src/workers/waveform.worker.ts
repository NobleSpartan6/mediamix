import { int16ToFloat32 } from '../utils/pcm'

interface GenerateMsg {
  type: 'GEN_WAVEFORM'
  payload: {
    samples: ArrayBuffer
    sampleRate: number
    peakCount: number
  }
}

interface DoneMsg {
  type: 'WAVEFORM'
  peaks: number[]
}

interface ErrorMsg {
  type: 'ERROR'
  error: string
}

self.onmessage = async (event: MessageEvent<GenerateMsg>) => {
  const { type, payload } = event.data
  if (type !== 'GEN_WAVEFORM') return
  try {
    const { samples, sampleRate, peakCount } = payload
    let floatSamples = int16ToFloat32(samples)
    let processed = floatSamples
    if (typeof OfflineAudioContext !== 'undefined') {
      try {
        const ctx = new OfflineAudioContext(1, floatSamples.length, sampleRate)
        const buffer = ctx.createBuffer(1, floatSamples.length, sampleRate)
        buffer.getChannelData(0).set(floatSamples)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.connect(ctx.destination)
        src.start()
        const rendered = await ctx.startRendering()
        processed = rendered.getChannelData(0)
      } catch (err) {
        console.warn('OfflineAudioContext failed in worker', err)
      }
    }
    const len = peakCount
    const step = processed.length / len
    const peaks = new Array<number>(len)
    for (let i = 0; i < len; i += 1) {
      const start = Math.floor(i * step)
      const end = Math.floor((i + 1) * step)
      let max = 0
      for (let j = start; j < end && j < processed.length; j += 1) {
        const v = Math.abs(processed[j])
        if (v > max) max = v
      }
      peaks[i] = max
    }
    const msg: DoneMsg = { type: 'WAVEFORM', peaks }
    self.postMessage(msg)
  } catch (err) {
    const msg: ErrorMsg = { type: 'ERROR', error: (err as Error).message }
    self.postMessage(msg)
  }
}
