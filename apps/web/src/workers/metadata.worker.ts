import { extractVideoMetadata } from '../lib/file/extractVideoMetadata'
import type { VideoMetadata } from '../lib/file/extractVideoMetadata'

// Default metadata object used when extraction fails
const emptyMetadata: VideoMetadata = {
  duration: null,
  width: null,
  height: null,
  videoCodec: null,
  audioCodec: null,
  frameRate: null,
  sampleRate: null,
  channelCount: null,
}

self.onmessage = async (event) => {
  const handles: FileSystemFileHandle[] = event.data
  const results: VideoMetadata[] = []
  for (const handle of handles) {
    try {
      const file = await handle.getFile()
      const metadata = await extractVideoMetadata(file)
      results.push(metadata ?? emptyMetadata)
    } catch (err) {
      console.error('metadata.worker failed for file handle:', err)
      results.push(emptyMetadata)
    }
  }
  self.postMessage(results)
}
