import { useCallback, useState } from 'react'
import useMotifStore from '../../lib/store'
import { extractVideoMetadata } from '../../lib/file/extractVideoMetadata'
import type { VideoMetadata } from '../../lib/file/extractVideoMetadata'
import { checkCodecSupport } from '../../lib/file/checkCodecSupport'
import { useMediaStore } from '../../state/mediaStore'

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
  const setFileInfo = useMotifStore((s) => s.setFileInfo)
  const setFileError = useMotifStore((s) => s.setFileError)
  const [loading, setLoading] = useState(false)

  const handleFileHandles = useCallback(async (handles: FileSystemFileHandle[]) => {
    setLoading(true)
    await Promise.all(
      handles.map(async (handle) => {
        try {
          const file = await handle.getFile()
          const metadata = (await extractVideoMetadata(file)) ?? defaultMetadata

          const { videoSupported, audioSupported } = await checkCodecSupport({
            width: metadata.width ?? undefined,
            height: metadata.height ?? undefined,
            sampleRate: metadata.sampleRate ?? undefined,
            channelCount: metadata.channelCount ?? undefined,
          })

          setFileInfo({
            fileName: file.name,
            fileSize: file.size,
            ...metadata,
            videoSupported,
            audioSupported,
          })

          if (videoSupported === false || audioSupported === false) {
            setFileError('This file\'s codecs are not supported.')
          } else {
            setFileError(null)
          }

          addMediaAsset({ fileName: file.name, fileHandle: handle, metadata })

          const assets = useMotifStore.getState().mediaAssets
          const assetId = assets[assets.length - 1]?.id
          if (assetId) {
            useMediaStore.getState().addAsset({
              id: assetId,
              fileName: file.name,
              duration: metadata.duration ?? 0,
              file,
            })
          }
        } catch (err) {
          console.error('Error importing file:', err)
          setFileError('Failed to import file.')
        }
      }),
    )
    setLoading(false)
  }, [addMediaAsset, setFileInfo, setFileError])

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