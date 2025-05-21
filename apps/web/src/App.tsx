import { useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from './components/ui/Button'
import MediaIngest from './features/import/MediaIngest'
import FileInfoCard from './features/import/FileInfoCard'
import MediaLibrary from './features/import/MediaLibrary'
import BeatMarkerBar from './features/timeline/BeatMarkerBar'
import { Timeline } from './features/timeline/components/Timeline'
import { CommandInput } from './features/timeline/components/CommandInput'
import AppShell from './features/shell/AppShell'
import { VideoPreview } from './features/preview'
import './App.css'
import { exportTimelineVideo } from './export/segment'
import { useExportStatus } from './lib/store/hooks'
import ExportProgress from './features/export/ExportProgress'
import { useTimelineStore } from './state/timelineStore'

function App() {
  // Demo beats & clips for showcasing the timeline MVP
  const clipsById = useTimelineStore((s) => s.clipsById)
  const clips = useMemo(() => Object.values(clipsById), [clipsById])
  const addClip = useTimelineStore((s) => s.addClip)
  const beats = useTimelineStore((s) => s.beats)
  const setBeats = useTimelineStore((s) => s.setBeats)


  const { isExporting } = useExportStatus()
  const handleExport = useCallback(() => {
    exportTimelineVideo()
  }, [])

  // Populate demo data once on mount if store is empty
  useEffect(() => {
    if (clips.length === 0) {
      addClip({ start: 0, end: 5, lane: 0 })
      addClip({ start: 6, end: 12, lane: 1 })
    }

    if (beats.length === 0) {
      // simple 1-second beat grid for demo purposes
      const demoBeats = Array.from({ length: 21 }, (_, i) => i) // 0s → 20s
      setBeats(demoBeats)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppShell>
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-accent text-ui-heading font-ui-semibold mb-1">Motif — Timeline MVP</h1>
        <p className="text-ui-body font-ui-normal text-gray-400">Local-First ✕ Hybrid AI Video Editor</p>
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        {/* Import / File details */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <MediaIngest />
            <FileInfoCard />
            <MediaLibrary />
            <BeatMarkerBar />
          </div>
          <div className="hidden md:block w-px bg-gray-700/40" />
          <div className="md:w-64 lg:w-80 self-start space-y-2">
            <Button className="w-full" variant="default" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting…' : 'Export Video'}
            </Button>
            <ExportProgress />
          </div>
        </div>

        {/* Timeline */}
        <section className="bg-gray-800/40 rounded-lg p-4">
          <h2 className="text-ui-body font-ui-medium text-gray-300 mb-2">Timeline</h2>
          <VideoPreview />
          <Timeline pixelsPerSecond={120} />
          <CommandInput />
        </section>
      </main>
    </AppShell>
  )
}

export default App
