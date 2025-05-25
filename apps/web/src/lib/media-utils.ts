import { useMediaStore } from '../state/mediaStore';

let worker: Worker | null = null;

function getMediaWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/mediaProcessor.worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (event) => {
      const { assetId, waveform, thumbnail, error, type } = event.data;
      const { updateAsset } = useMediaStore.getState();

      if (error) {
        console.error(`Error processing asset ${assetId}:`, error);
        // Optionally, update asset state to indicate error
        // updateAsset(assetId, { processingError: error }); 
        return;
      }

      if (type === 'waveformResult' && waveform) {
        updateAsset(assetId, { waveform });
      } else if (type === 'thumbnailResult' && thumbnail) {
        updateAsset(assetId, { thumbnail });
      }
    };

    worker.onerror = (err) => {
      console.error('Media processing worker error:', err);
      // Potentially terminate and recreate worker on certain errors
    };
  }
  return worker;
}

export function processMediaAsset(assetId: string, file: File): void {
  const workerInstance = getMediaWorker();
  
  if (file.type.startsWith('audio/')) {
    workerInstance.postMessage({ file, assetId, type: 'generateWaveform' });
  } else if (file.type.startsWith('video/')) {
    // For video, we want both thumbnail and waveform (if it has audio)
    workerInstance.postMessage({ file, assetId, type: 'generateThumbnail' });
    // We could try to extract audio from video and then generate waveform.
    // For now, let's assume videos might also have useful waveforms if audio is present.
    // This might need a more sophisticated check or separate audio track extraction first.
    workerInstance.postMessage({ file, assetId, type: 'generateWaveform' });
  }
}

export function terminateMediaWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
