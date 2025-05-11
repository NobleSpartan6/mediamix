import BeatDetectionWorker from '../../workers/beat-detection.worker.ts?worker';
import { extractAudioTrack } from './extractAudioTrack';
import { int16ToFloat32 } from '../../utils/pcm';

export async function detectBeatsFromVideo(
  videoFile: File,
  onProgress?: (stage: string, value?: number) => void,
): Promise<number[]> {
  // 1. Extract raw PCM audio
  onProgress?.('extractAudio', 0);
  const { audioData, sampleRate } = await extractAudioTrack(
    videoFile,
    'raw',
    (p) => onProgress?.('extractAudio', p),
  );
  onProgress?.('extractAudio', 1);

  // 2. Convert to Float32 PCM
  const floatSamples = int16ToFloat32(audioData);

  // 3. Spawn beat detection worker
  return new Promise((resolve, reject) => {
    const worker = new BeatDetectionWorker();
    worker.onmessage = (event: MessageEvent<{ type: string; beats?: number[]; error?: string }>) => {
      const { type } = event.data;
      if (type === 'BEATS_DETECTED') {
        resolve(event.data.beats || []);
        worker.terminate();
      } else if (type === 'ERROR') {
        reject(new Error(event.data.error || 'Unknown error in beat detection'));
        worker.terminate();
      }
    };
    worker.onerror = (err: ErrorEvent) => {
      reject(new Error(err.message));
      worker.terminate();
    };
    worker.postMessage({
      type: 'DETECT_BEATS',
      payload: {
        samples: floatSamples.buffer,
        sampleRate,
      },
    }, [floatSamples.buffer]);
  });
} 