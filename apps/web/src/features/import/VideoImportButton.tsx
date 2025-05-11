import { useCallback } from 'react'
import { Button } from '../../components/ui/Button'
import { selectVideoFile } from '../../lib/file/selectVideoFile'
import { extractVideoMetadata } from '../../lib/file/extractVideoMetadata'
import { checkCodecSupport } from '../../lib/file/checkCodecSupport'
import useMotifStore from '../../lib/store'
import { useFileState, useResetStore } from '../../lib/store/hooks'
import { detectBeatsFromVideo } from '../../lib/file/detectBeatsFromVideo'
import { useBeatDetection } from '../../lib/store/hooks'
import type { BeatMarker } from '../../lib/store/types'
import { BeatDetectionProgress } from './BeatDetectionProgress'

export function VideoImportButton() {
  const { isFileLoading, fileError, setFileInfo } = useFileState()
  const resetStore = useResetStore()
  const setIsFileLoading = useMotifStore((s) => s.setIsFileLoading)
  const setFileError = useMotifStore((s) => s.setFileError)
  const addMediaAsset = useMotifStore((s) => s.addMediaAsset)
  const {
    setIsBeatDetectionRunning,
    setBeatMarkers,
    setBeatDetectionError,
    setBeatDetectionProgress,
    setBeatDetectionStage,
  } = useBeatDetection()

  const handleImport = useCallback(async () => {
    setFileError(null)
    setIsFileLoading(true)
    // Reset beat-detection progress UI
    setBeatDetectionStage('idle')
    setBeatDetectionProgress(0)
    try {
      const selections = await selectVideoFile()
      if (!selections) return // user cancelled, no error
      // Process each selected file
      for (const { file, handle } of selections) {
        // Basic file info first
        setFileInfo({
          fileName: file.name,
          fileSize: file.size,
          fileHandle: handle ?? null,
        })

        // Extract metadata (duration, dimensions, codecs)
        const metadata = await extractVideoMetadata(file)

        if (!metadata) {
          throw new Error(
            'Unable to read video metadata. The file might be corrupted or its format is not supported by this browser.'
          )
        }

        // Persist metadata in global state
        setFileInfo(metadata)
        // Add asset to media library
        addMediaAsset({ fileName: file.name, fileHandle: handle ?? null, metadata })

        /*
         * === Beat Detection ===
         * Kick off beat detection immediately after successful video import & metadata extraction.
         * Updates global store (isBeatDetectionRunning, beatMarkers, beatDetectionError) for reactive UI.
         */
        setIsBeatDetectionRunning(true)
        setBeatDetectionStage('extractAudio')
        setBeatDetectionProgress(0)
        try {
          const beats = await detectBeatsFromVideo(file, (stage, progress) => {
            if (stage === 'extractAudio') {
              setBeatDetectionStage('extractAudio')
              setBeatDetectionProgress(progress ?? 0)
              if (progress === 1) {
                setBeatDetectionStage('detectBeats')
                setBeatDetectionProgress(0)
              }
            }
          })
          // Map beats to BeatMarker objects with generated IDs
          const markers: BeatMarker[] = beats.map((t, idx) => ({ id: `beat-${idx}`, timestamp: t, confidence: 1 }))
          setBeatMarkers(markers)
          setBeatDetectionError(null)
          setBeatDetectionProgress(1)
        } catch (beatErr: any) {
          console.error('Beat detection failed:', beatErr)
          setBeatDetectionError(
            typeof beatErr?.message === 'string'
              ? beatErr.message
              : 'An error occurred during beat detection.'
          )
        } finally {
          setIsBeatDetectionRunning(false)
          setBeatDetectionStage('idle')
        }

        /*
         * Check codec support. Treat explicit lack of support (false) as an error the
         * user must fix (e.g., by switching browser or converting the file). Null
         * means the browser cannot determine support (e.g., WebCodecs unavailable),
         * which is a warning rather than a blocker for the demo.
         */
        try {
          const { videoSupported, audioSupported } = await checkCodecSupport({
            width: metadata.width ?? undefined,
            height: metadata.height ?? undefined,
            sampleRate: metadata.sampleRate ?? undefined,
            channelCount: metadata.channelCount ?? undefined,
          })

          // Store support flags regardless of outcome so UI can reflect them
          setFileInfo({ videoSupported, audioSupported })

          if (videoSupported === false) {
            throw new Error(
              'This browser does not support the video codec used in the selected file (H.264/H.265). Try a different browser or convert the video.'
            )
          }

          if (audioSupported === false) {
            throw new Error(
              'This browser does not support the audio codec used in the selected file (AAC/MP3/Opus). Try a different browser or convert the video.'
            )
          }
        } catch (codecErr: any) {
          // If error thrown above, rethrow to trigger catch block. For unexpected
          // errors (e.g., isConfigSupported throws) we just log a warning.
          if (codecErr instanceof Error) {
            throw codecErr
          }
          console.warn('Codec support check failed', codecErr)
        }
      }
    } catch (err: any) {
      // Reset store to ensure consistent state after a failure
      resetStore()

      // Log detailed error for debugging but present user-friendly message
      console.error('Video import failed:', err)
      const userMessage =
        typeof err?.message === 'string'
          ? err.message
          : 'An unexpected error occurred while importing the video.'
      setFileError(userMessage)
    } finally {
      setIsFileLoading(false)
    }
  }, [setFileError, setFileInfo, setIsFileLoading, resetStore, setIsBeatDetectionRunning, setBeatMarkers, setBeatDetectionError, setBeatDetectionProgress, setBeatDetectionStage, addMediaAsset])

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button onClick={handleImport} disabled={isFileLoading}>
        {isFileLoading ? 'Loading…' : 'Import Video'}
      </Button>
      {fileError && (
        <p className="text-red-500 text-xs font-ui-normal">{fileError}</p>
      )}
      <BeatDetectionProgress />
    </div>
  )
}

export default VideoImportButton 