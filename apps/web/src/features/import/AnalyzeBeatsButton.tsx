import { Button } from '../../components/ui/Button'
import { BeatDetectionProgress } from './BeatDetectionProgress'
import { detectBeatsFromVideo } from '../../lib/file/detectBeatsFromVideo'
import { generateProxy } from '../../workers/proxy'
import { useBeatDetection } from '../../lib/store/hooks'
import useMotifStore from '../../lib/store'
import { useMediaStore } from '../../state/mediaStore'
import { useCallback } from 'react'
import { useTimelineStore } from '../../state/timelineStore'

export function AnalyzeBeatsButton() {
  const {
    isBeatDetectionRunning,
    setIsBeatDetectionRunning,
    setBeatDetectionProgress,
    setBeatDetectionStage,
  } = useBeatDetection()

  const handleAnalyze = useCallback(async () => {
    const { mediaAssets } = useMotifStore.getState()
    if (mediaAssets.length === 0) {
      console.warn('No media assets to analyze')
      return
    }
    const asset = mediaAssets[mediaAssets.length - 1]
    const media = useMediaStore.getState().assets[asset.id]
    if (!media?.file) {
      console.warn('No file found for asset', asset.id)
      return
    }
    let analysisFile = media.file
    if (media.duration > 600) {
      try {
        const data = await generateProxy(media.file)
        analysisFile = new File([data], `proxy-${media.file.name}`, { type: 'video/mp4' })
      } catch (err) {
        console.warn('Proxy generation failed', err)
      }
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
      useTimelineStore.getState().setBeats(beats)
    } catch (err) {
      console.error('Beat detection failed:', err)
    } finally {
      setIsBeatDetectionRunning(false)
      setBeatDetectionStage('idle')
    }
  }, [setIsBeatDetectionRunning, setBeatDetectionProgress, setBeatDetectionStage])

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        className="w-full"
        onClick={handleAnalyze}
        disabled={isBeatDetectionRunning}
        title="Detect beat markers from this media’s audio"
      >
        Analyze Beats
      </Button>
      <BeatDetectionProgress />
    </div>
  )
}

export default AnalyzeBeatsButton
