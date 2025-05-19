import MetadataWorker from '../../workers/metadata.worker.ts?worker'
import type { VideoMetadata } from './extractVideoMetadata'

export function extractMetadataFromHandles(handles: FileSystemFileHandle[]): Promise<VideoMetadata[]> {
  return new Promise((resolve, reject) => {
    const worker = new MetadataWorker()
    worker.onmessage = (event: MessageEvent<VideoMetadata[]>) => {
      resolve(event.data)
      worker.terminate()
    }
    worker.onerror = (err: ErrorEvent) => {
      reject(new Error(err.message))
      worker.terminate()
    }
    worker.postMessage(handles)
  })
}

