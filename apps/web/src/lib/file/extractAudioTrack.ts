// apps/web/src/lib/file/extractAudioTrack.ts

// Import the worker. The `?worker` suffix is a Vite-specific feature
// that handles the worker bundling.
import AudioExtractionWorker from '../../workers/audio-extraction.worker.ts?worker';
import { WorkerWrapper } from '../../workers/WorkerWrapper';

interface BaseWorkerMessage {
  type: string;
}

interface ExtractedAudioDataMessage extends BaseWorkerMessage {
  type: 'AUDIO_EXTRACTED';
  audioData: ArrayBuffer;
  format: 'wav' | 'raw';
  sampleRate: number;
}

interface WorkerErrorMessage extends BaseWorkerMessage {
  type: 'ERROR';
  error: string;
}

interface WorkerProgressMessage extends BaseWorkerMessage {
  type: 'PROGRESS';
  progress: number;
}

// A union type for all possible messages from the worker
type AudioWorkerMessage = 
  | ExtractedAudioDataMessage 
  | WorkerErrorMessage 
  | WorkerProgressMessage;

interface ExtractedAudioData {
  audioData: ArrayBuffer;
  format: 'wav' | 'raw';
  sampleRate: number;
}

export function extractAudioTrack(
  videoFile: File,
  outputFormat: 'wav' | 'raw' = 'wav',
  onProgress?: (progress: number) => void
): Promise<ExtractedAudioData> {
  return new Promise((resolve, reject) => {
    if (!videoFile) {
      reject(new Error('No video file provided to extractAudioTrack.'));
      return;
    }

    // Use the WorkerWrapper instead of direct Worker instantiation
    const worker = new WorkerWrapper(AudioExtractionWorker);

    worker.onmessage = (
      event: MessageEvent<AudioWorkerMessage>
    ) => {
      const data = event.data;
      // console.log('Message from audio extraction worker:', data);

      switch (data.type) {
        case 'AUDIO_EXTRACTED':
          resolve({ audioData: data.audioData, format: data.format, sampleRate: data.sampleRate });
          worker.terminate();
          break;
        case 'ERROR':
          reject(new Error(data.error));
          worker.terminate();
          break;
        case 'PROGRESS':
          if (onProgress) {
            onProgress(data.progress);
          }
          break;
        // No default needed if all types are handled, but good for safety if types might expand
        // default:
        //   console.warn('Unknown message type from audio worker:', data.type);
        //   break;
      }
    };

    worker.onerror = (error: ErrorEvent) => {
      console.error('Error in audio extraction worker:', error);
      reject(new Error(`Worker error: ${error.message}`));
      worker.terminate();
    };

    // Send the video file to the worker
    // The worker will read its ArrayBuffer
    worker.postMessage({ 
      type: 'EXTRACT_AUDIO', 
      payload: { videoFile, outputFormat }
    });
  });
}