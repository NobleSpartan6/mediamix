import { useCallback } from 'react'
import { Button } from '../../components/ui/Button'
import { selectVideoFile } from '../../lib/file/selectVideoFile'
import { extractVideoMetadata } from '../../lib/file/extractVideoMetadata'
import { checkCodecSupport } from '../../lib/file/checkCodecSupport'
import useMotifStore from '../../lib/store'
import { useFileState, useResetStore } from '../../lib/store/hooks'
import { useBeatDetection } from '../../lib/store/hooks'
import { useMediaStore } from '../../state/mediaStore'

export function VideoImportButton() {
  const { isFileLoading, fileError, setFileInfo } = useFileState()
  const resetStore = useResetStore()
  const setIsFileLoading = useMotifStore((s) => s.setIsFileLoading)
  const setFileError = useMotifStore((s) => s.setFileError)
  const addMediaAsset = useMotifStore((s) => s.addMediaAsset)
  const { setBeatDetectionProgress, setBeatDetectionStage } = useBeatDetection()

  const handleImport = useCallback(async () => {
    setFileError(null)
    setIsFileLoading(true)
    setBeatDetectionStage('idle')
    setBeatDetectionProgress(0)
    try {
      const selection = await selectVideoFile()
      if (!selection) return
      const { file, handle } = selection

      setFileInfo({
        fileName: file.name,
        fileSize: file.size,
        fileHandle: handle ?? null,
      })

      const metadata = await extractVideoMetadata(file)
      if (!metadata) {
        throw new Error(
          'Unable to read video metadata. The file might be corrupted or its format is not supported by this browser.'
        )
      }

      setFileInfo(metadata)
      addMediaAsset({ fileName: file.name, fileHandle: handle ?? null, metadata })

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

      try {
        const { videoSupported, audioSupported } = await checkCodecSupport({
          width: metadata.width ?? undefined,
          height: metadata.height ?? undefined,
          sampleRate: metadata.sampleRate ?? undefined,
          channelCount: metadata.channelCount ?? undefined,
        })
        setFileInfo({ videoSupported, audioSupported })
        if (videoSupported === false || audioSupported === false) {
          setFileError('This file\'s codecs are not supported.')
        } else {
          setFileError(null)
        }
      } catch (codecErr: any) {
        console.warn('Codec support check failed', codecErr)
      }
    } catch (err: any) {
      resetStore()
      console.error('Video import failed:', err)
      const userMessage =
        typeof err?.message === 'string'
          ? err.message
          : 'An unexpected error occurred while importing the video.'
      setFileError(userMessage)
    } finally {
      setIsFileLoading(false)
    }
  }, [setFileError, setFileInfo, setIsFileLoading, resetStore, addMediaAsset, setBeatDetectionProgress, setBeatDetectionStage])

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button onClick={handleImport} disabled={isFileLoading}>
        {isFileLoading ? 'Loading…' : 'Import Video'}
      </Button>
      {fileError && (
        <p className="text-red-500 text-xs font-ui-normal">{fileError}</p>
      )}
    </div>
  )
}

export default VideoImportButton
