import { useEffect } from 'react'
import { useFileState, useBeatDetection, useTimeline, useExportStatus } from './lib/store/hooks'

export function StoreTest() {
  const { fileInfo } = useFileState()
  const { beatMarkers } = useBeatDetection()
  const { clips } = useTimeline()
  const { isExporting, exportProgress } = useExportStatus()

  useEffect(() => {}, [])

  return (
    <div className="p-4 bg-panel-bg-secondary rounded-lg">
      <h2 className="text-ui-body font-ui-medium text-text-secondary mb-3">Store Test</h2>
      <pre className="text-xs bg-panel-bg p-2 rounded">
        {JSON.stringify(
          {
            fileInfo,
            beatMarkersCount: beatMarkers.length,
            clipsCount: clips.length,
            isExporting,
            exportProgress,
          },
          null,
          2,
        )}
      </pre>
    </div>
  )
}
