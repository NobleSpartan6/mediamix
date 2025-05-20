import { extractAudioTrack } from './extractAudioTrack'
import WaveformWorker from '../../workers/waveform.worker.ts?worker'
import { cacheKeyForFile } from './cacheKey'
import { getCachedAnalysis, setCachedAnalysis } from '../cache'

export async function generateWaveform(
  videoFile: File,
  peakCount = 200,
): Promise<number[]> {
  const key = `${cacheKeyForFile(videoFile)}-waveform-${peakCount}`
  const cached = await getCachedAnalysis<number[]>(key)
  if (cached) return cached

  const { audioData, sampleRate } = await extractAudioTrack(videoFile, 'raw')

  const peaks = await new Promise<number[]>((resolve, reject) => {
    const worker = new WaveformWorker()
    worker.onmessage = (
      event: MessageEvent<{ type: string; peaks?: number[]; error?: string }>,
    ) => {
      if (event.data.type === 'WAVEFORM') {
        resolve(event.data.peaks ?? [])
        worker.terminate()
      } else if (event.data.type === 'ERROR') {
        reject(new Error(event.data.error ?? 'waveform worker error'))
        worker.terminate()
      }
    }
    worker.onerror = (err: ErrorEvent) => {
      reject(new Error(err.message))
      worker.terminate()
    }
    worker.postMessage(
      { type: 'GEN_WAVEFORM', payload: { samples: audioData, sampleRate, peakCount } },
      [audioData],
    )
  })

  await setCachedAnalysis(key, peaks)
  return peaks
}
