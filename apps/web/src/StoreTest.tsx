import { useEffect } from 'react'
import { useFileState, useBeatDetection, useTimeline, useExportStatus } from './lib/store/hooks'

export function StoreTest() {
  const { fileInfo } = useFileState()
  const { beatMarkers } = useBeatDetection()
  const { clips } = useTimeline()
  const { isExporting, exportProgress } = useExportStatus()

  useEffect(() => {
    console.log('Store hooks are working!')
  }, [])

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-ui-body font-ui-medium text-gray-300 mb-3">Store Test</h2>
      <pre className="text-xs bg-gray-900 p-2 rounded">
        {JSON.stringify({
          fileInfo,
          beatMarkersCount: beatMarkers.length,
          clipsCount: clips.length,
          isExporting,
          exportProgress,
        }, null, 2)}
      </pre>
    </div>
  )
} 