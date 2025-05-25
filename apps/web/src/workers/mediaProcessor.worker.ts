// apps/web/src/workers/mediaProcessor.worker.ts

import { generateWaveform, captureThumbnail } from '../lib/file'

interface WorkerData {
  file: File;
  assetId: string;
  type: 'generateWaveform' | 'generateThumbnail';
}

self.onmessage = async (event: MessageEvent<WorkerData>) => {
  const { file, assetId, type } = event.data;

  try {
    if (type === 'generateWaveform') {
      const waveform = await generateWaveform(file)
      self.postMessage({ assetId, waveform, type: 'waveformResult' })
    } else if (type === 'generateThumbnail') {
      const thumbnail = await captureThumbnail(file)
      self.postMessage({ assetId, thumbnail, type: 'thumbnailResult' })
    }
  } catch (error) {
    console.error(`[Worker] Error processing ${assetId} (${type}):`, error);
    self.postMessage({ assetId, error: (error as Error).message, type: 'processingError' });
  }
};

export {}; // Make it a module
