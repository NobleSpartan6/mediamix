import { useEffect, useRef, useMemo } from 'react'
import { Button } from './components/ui/Button'
import VideoImportButton from './features/import/VideoImportButton'
import FileInfoCard from './features/import/FileInfoCard'
import BeatMarkerBar from './features/timeline/BeatMarkerBar'
import { Timeline } from './features/timeline/components/Timeline'
import './App.css'
import { useTimelineStore } from './state/timelineStore'
import useMotifStore from './lib/store'

function App() {
  // Demo beats & clips for showcasing the timeline MVP
  const clipsById = useTimelineStore((s) => s.clipsById)
  const clips = useMemo(() => Object.values(clipsById), [clipsById])
  const addClip = useTimelineStore((s) => s.addClip)
  const beats = useTimelineStore((s) => s.beats)
  const setBeats = useTimelineStore((s) => s.setBeats)

  // Demo: seed clips from imported media assets
  const mediaAssets = useMotifStore((s) => s.mediaAssets)
  const prevAssetCount = useRef(0)
  useEffect(() => {
    if (mediaAssets.length > prevAssetCount.current) {
      const newAssets = mediaAssets.slice(prevAssetCount.current)
      newAssets.forEach((asset, idx) => {
        // demo: use first 5 seconds or asset duration
        const end =
          asset.metadata.duration != null
            ? Math.min(5, asset.metadata.duration)
            : 5
        const baseLane = (prevAssetCount.current + idx) * 2
        addClip({ start: 0, end, lane: baseLane, assetId: asset.id })
        addClip({ start: 0, end, lane: baseLane + 1, assetId: asset.id })
      })
      prevAssetCount.current = mediaAssets.length
    }
  }, [mediaAssets, addClip])

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
    <div className="min-h-screen bg-panel-bg text-white flex flex-col p-6 font-sans">
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
            <VideoImportButton />
            <FileInfoCard />
            <BeatMarkerBar />
          </div>
          <div className="hidden md:block w-px bg-gray-700/40" />
          <div className="md:w-64 lg:w-80 self-start">
            <Button className="w-full" variant="default">
              Export (stub)
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <section className="bg-gray-800/40 rounded-lg p-4">
          <h2 className="text-ui-body font-ui-medium text-gray-300 mb-2">Timeline</h2>
          <Timeline pixelsPerSecond={120} />
        </section>
      </main>
    </div>
  )
}

export default App
