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
import { useMediaStore } from '../../state/mediaStore'
import { generateWaveform } from '../../lib/file/generateWaveform'
import { captureThumbnail } from '../../lib/file/captureThumbnail'
import { generateProxy } from '../../workers/proxy'

export function VideoImportButton() {
  const { isFileLoading, fileError, setFileInfo } = useFileState()
  const resetStore = useResetStore()
  const setIsFileLoading = useMotifStore((s) => s.setIsFileLoading)
  const setFileError = useMotifStore((s) => s.setFileError)
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
    setBeatDetectionStage('idle')
    setBeatDetectionProgress(0)
    try {
      const selection = await selectVideoFile()
      if (!selection) return
      const { file, handle } = selection

        let analysisFile: File = file
        let proxyUrl: string | undefined

        setFileInfo({
          fileName: file.name,
          fileSize: file.size,
          fileHandle: handle ?? null,
        })

        const metadata = await extractVideoMetadata(file)
        if (!metadata) {
          throw new Error(
            'Unable to read video metadata. The file might be corrupted or its format is not supported by this browser.',
          )
        }
        setFileInfo(metadata)

        const assetId = useMediaStore.getState().addAsset({
          fileName: file.name,
          duration: metadata.duration ?? 0,
        })

        if ((metadata.duration ?? 0) > 600) {
          try {
            const data = await generateProxy(file)
            const blob = new Blob([data], { type: 'video/mp4' })
            analysisFile = new File([data], `proxy-${file.name}`, { type: 'video/mp4' })
            proxyUrl = URL.createObjectURL(blob)
          } catch (err) {
            console.warn('Proxy generation failed', err)
          }
        }

        try {
          const [waveform, thumbnail] = await Promise.all([
            generateWaveform(analysisFile),
            captureThumbnail(analysisFile),
          ])
          useMediaStore.getState().updateAsset(assetId, {
            waveform,
            thumbnail,
            ...(proxyUrl ? { proxyUrl } : {}),
          })
        } catch (analysisErr) {
          console.warn('Media analysis failed', analysisErr)
        }

        try {
          const { videoSupported, audioSupported } = await checkCodecSupport({
            width: metadata.width ?? undefined,
            height: metadata.height ?? undefined,
            sampleRate: metadata.sampleRate ?? undefined,
            channelCount: metadata.channelCount ?? undefined,
          })
          setFileInfo({ videoSupported, audioSupported })
        } catch (codecErr: any) {
          console.warn('Codec support check failed', codecErr)
        }

        setIsBeatDetectionRunning(true)
        setBeatDetectionStage('extractAudio')
        setBeatDetectionProgress(0)
        try {
          const beats = await detectBeatsFromVideo(analysisFile, (stage, progress) => {
            if (stage === 'extractAudio') {
              setBeatDetectionStage('extractAudio')
              setBeatDetectionProgress(progress ?? 0)
              if (progress === 1) {
                setBeatDetectionStage('detectBeats')
                setBeatDetectionProgress(0)
              }
            }
          })
          const markers: BeatMarker[] = beats.map((t, idx) => ({
            id: `beat-${idx}`,
            timestamp: t,
            confidence: 1,
          }))
          setBeatMarkers(markers)
          setBeatDetectionError(null)
          setBeatDetectionProgress(1)
        } catch (beatErr: any) {
          console.error('Beat detection failed:', beatErr)
          setBeatDetectionError(
            typeof beatErr?.message === 'string' ? beatErr.message : 'An error occurred during beat detection.',
          )
        } finally {
          setIsBeatDetectionRunning(false)
          setBeatDetectionStage('idle')
        }
    } catch (err: any) {
      resetStore()
      console.error('Video import failed:', err)
      const userMessage =
        typeof err?.message === 'string' ? err.message : 'An unexpected error occurred while importing the video.'
      setFileError(userMessage)
    } finally {
      setIsFileLoading(false)
    }
  }, [
    setFileError,
    setFileInfo,
    setIsFileLoading,
    resetStore,
    setIsBeatDetectionRunning,
    setBeatMarkers,
    setBeatDetectionError,
    setBeatDetectionProgress,
    setBeatDetectionStage,
  ])

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button onClick={handleImport} disabled={isFileLoading}>
        {isFileLoading ? 'Loading…' : 'Import Video'}
      </Button>
      {fileError && <p className="text-red-500 text-xs font-ui-normal">{fileError}</p>}
      <BeatDetectionProgress />
    </div>
  )
}

export default VideoImportButton
