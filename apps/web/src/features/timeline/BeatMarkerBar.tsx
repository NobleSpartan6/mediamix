import { useMemo } from 'react'
import { useBeatDetection, useFileState } from '../../lib/store/hooks'

/**
 * BeatMarkerBar – renders detected beat timestamps as vertical lines along an SVG timeline.
 * Complies with hard rule: no inline style objects.
 */
export function BeatMarkerBar() {
  const { beatMarkers } = useBeatDetection()
  const { fileInfo } = useFileState()

  const duration = fileInfo.duration ?? 0

  const markerPercents = useMemo(() => {
    if (duration <= 0) return []
    return beatMarkers.map((m) => ({ id: m.id, pct: (m.timestamp / duration) * 100 }))
  }, [beatMarkers, duration])

  if (markerPercents.length === 0 || duration <= 0) return null

  return (
    <div className="w-full select-none">
      <svg className="w-full h-8 bg-panel-bg-secondary rounded" viewBox="0 0 100 8" preserveAspectRatio="none">
        {/* Baseline */}
        <line x1="0" y1="4" x2="100" y2="4" stroke="#3f3f46" strokeWidth="0.2" />
        {/* Beat markers */}
        {markerPercents.map((marker) => (
          <line
            key={marker.id}
            x1={`${marker.pct}`}
            y1="0"
            x2={`${marker.pct}`}
            y2="8"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-accent"
          />
        ))}
      </svg>
    </div>
  )
}

export default BeatMarkerBar
