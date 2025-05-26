import { useCallback, useEffect } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from 'react-resizable-panels'
import AppShell from './features/shell/AppShell'
import MediaIngest from './features/import/MediaIngest'
import FileInfoCard from './features/import/FileInfoCard'
import AnalyzeBeatsButton from './features/import/AnalyzeBeatsButton'
import MediaLibrary from './features/import/MediaLibrary'
import BeatMarkerBar from './features/timeline/BeatMarkerBar'
import { Timeline } from './features/timeline/components/Timeline'
import { CommandInput } from './features/timeline/components/CommandInput'
import { VideoPreview } from './features/preview'
import Panel from './components/Panel'
import InspectorPanel from './features/inspector/InspectorPanel'
import { useUILayoutStore } from './state/uiLayoutStore'
import './index.css'

export default function App() {
  const {
    showLibrary,
    showInspector,
    librarySize,
    inspectorSize,
    previewSize,
    setLibrarySize,
    setInspectorSize,
    setPreviewSize,
    setShowInspector,
    setShowLibrary,
  } = useUILayoutStore()

  // Responsive collapse of inspector below 1200px
  useEffect(() => {
    const handle = () => {
      if (window.innerWidth < 1200) setShowInspector(false)
    }
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [setShowInspector])

  const handleHorizontal = useCallback(
    (sizes: number[]) => {
      if (showLibrary) setLibrarySize(sizes[0])
      if (showInspector) setInspectorSize(sizes[sizes.length - 1])
    },
    [setLibrarySize, setInspectorSize, showLibrary, showInspector],
  )

  const handleVertical = useCallback(
    (sizes: number[]) => {
      setPreviewSize(sizes[0])
    },
    [setPreviewSize],
  )

  return (
    <AppShell>
      <div className="editor-grid h-full">
        <header className="header-area p-4 text-center">
          <h1 className="text-accent text-ui-heading font-ui-semibold mb-1">Motif — Timeline MVP</h1>
          <p className="text-ui-body font-ui-normal text-gray-400">Local-First ✕ Hybrid AI Video Editor</p>
        </header>
        <ResizablePanelGroup direction="horizontal" className="contents" onLayout={handleHorizontal}>
          {showLibrary && (
            <ResizablePanel defaultSize={librarySize} minSize={20} className="library-area row-span-2 min-w-[220px]">
              <Panel title="Library" onCollapse={() => setShowLibrary(false)}>
                <MediaIngest />
                <FileInfoCard />
                <AnalyzeBeatsButton />
                <MediaLibrary />
                <BeatMarkerBar />
              </Panel>
            </ResizablePanel>
          )}
          {showLibrary && <ResizableHandle className="row-span-2" />}

          <ResizablePanel defaultSize={60} className="row-span-2">
            <ResizablePanelGroup direction="vertical" className="contents" onLayout={handleVertical}>
              <ResizablePanel defaultSize={previewSize} minSize={20} className="preview-area">
                <Panel title="Preview">
                  <VideoPreview />
                </Panel>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={100 - previewSize} minSize={20} className="timeline-area">
                <Panel title="Timeline">
                  <Timeline pixelsPerSecond={120} />
                  <CommandInput />
                </Panel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {showInspector && <ResizableHandle className="row-span-2" />}
          {showInspector && (
            <ResizablePanel
              defaultSize={inspectorSize}
              minSize={20}
              className="inspector-area row-span-2 min-w-[220px]"
            >
              <Panel title="Inspector" onCollapse={() => setShowInspector(false)}>
                <InspectorPanel />
              </Panel>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </AppShell>
  )
}
