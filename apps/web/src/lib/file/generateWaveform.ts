import { extractAudioTrack } from './extractAudioTrack'
import { int16ToFloat32 } from '../../utils/pcm'

export async function generateWaveform(
  videoFile: File,
  peakCount = 200,
): Promise<number[]> {
  const { audioData, sampleRate } = await extractAudioTrack(
    videoFile,
    'raw',
  )
  let samples = int16ToFloat32(audioData)
  if (typeof OfflineAudioContext !== 'undefined') {
    try {
      const ctx = new OfflineAudioContext(1, samples.length, sampleRate)
      const buffer = ctx.createBuffer(1, samples.length, sampleRate)
      buffer.getChannelData(0).set(samples)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.connect(ctx.destination)
      src.start()
      const rendered = await ctx.startRendering()
      samples = rendered.getChannelData(0)
    } catch (err) {
      console.warn('OfflineAudioContext processing failed', err)
    }
  }
  const len = peakCount
  const step = samples.length / len
  const peaks = new Array<number>(len)
  for (let i = 0; i < len; i += 1) {
    const start = Math.floor(i * step)
    const end = Math.floor((i + 1) * step)
    let max = 0
    for (let j = start; j < end && j < samples.length; j += 1) {
      const v = Math.abs(samples[j])
      if (v > max) max = v
    }
    peaks[i] = max
  }
  return peaks
}
