import { useCallback, useState } from 'react'
import useMotifStore from '../../lib/store'
import { extractVideoMetadata } from '../../lib/file/extractVideoMetadata'
import type { VideoMetadata } from '../../lib/file/extractVideoMetadata'

const defaultMetadata: VideoMetadata = {
  duration: null,
  width: null,
  height: null,
  videoCodec: null,
  audioCodec: null,
  frameRate: null,
  sampleRate: null,
  channelCount: null
}

export default function MediaIngest() {
  const addMediaAsset = useMotifStore((s) => s.addMediaAsset)
  const [loading, setLoading] = useState(false)

  const handleFileHandles = useCallback(async (handles: FileSystemFileHandle[]) => {
    setLoading(true)
    await Promise.all(
      handles.map(async (handle) => {
        try {
          const file = await handle.getFile()
          const metadata = (await extractVideoMetadata(file)) ?? defaultMetadata
          addMediaAsset({ fileName: file.name, fileHandle: handle, metadata })
        } catch (err) {
          console.error('Error importing file:', err)
        }
      }),
    )
    setLoading(false)
  }, [addMediaAsset])

  const openPicker = async () => {
    try {
      const handles = await (window as any).showOpenFilePicker({
        multiple: true,
        types: [
          {
            description: 'Video Files',
            accept: {
              'video/mp4': ['.mp4'],
              'video/quicktime': ['.mov']
            }
          }
        ]
      })
      await handleFileHandles(handles)
    } catch (err) {
      // Swallow user cancellation but log unexpected errors
      if (err && (err as DOMException).name !== 'AbortError') {
        console.error('File picker error:', err)
      }
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const handles: FileSystemFileHandle[] = []
      await Promise.all(
        Array.from(e.dataTransfer.items).map(async (item) => {
          if (item.kind !== 'file') return
          const withHandle = item as DataTransferItem & {
            getAsFileSystemHandle?: () => Promise<FileSystemHandle>
          }
          try {
            const handle = await withHandle.getAsFileSystemHandle?.()
            if (handle && handle.kind === 'file') {
              handles.push(handle as FileSystemFileHandle)
            }
          } catch (err) {
            console.error('Drop import error:', err)
          }
        }),
      )
      if (handles.length > 0) {
        await handleFileHandles(handles)
      }
    },
    [handleFileHandles],
  )

  return (
    <div
      className="p-4 border-2 border-dashed border-gray-600 rounded"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <button onClick={openPicker} className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50" disabled={loading}>
        {loading ? 'Importing...' : 'Import Media'}
      </button>
    </div>
  )
} 