import { useBeatDetection } from '../../lib/store/hooks'

/**
 * BeatDetectionProgress – shows current stage & percentage of the beat-detection pipeline.
 * Uses native <progress> element to avoid inline style objects (hard rule compliance).
 */
export function BeatDetectionProgress() {
  const { isBeatDetectionRunning, beatDetectionProgress, beatDetectionStage } = useBeatDetection()

  if (!isBeatDetectionRunning) return null

  const label = beatDetectionStage === 'extractAudio' ? 'Extracting audio…' : 'Detecting beats…'

  return (
    <div className="w-full space-y-1">
      <span className="block text-xs text-gray-400 font-ui-normal" role="status">
        {label}
      </span>
      {/* Native progress element styled via Tailwind; appearance reset for consistency */}
      <progress
        value={beatDetectionProgress}
        max={1}
        className="w-full h-1 [appearance:none] bg-panel-bg-secondary rounded overflow-hidden [&::-webkit-progress-bar]:bg-panel-bg-secondary [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent"
      />
    </div>
  )
}

export default BeatDetectionProgress
