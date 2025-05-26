import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  showLibrary: boolean
  showInspector: boolean
  librarySize: number
  inspectorSize: number
  previewSize: number
  setShowLibrary: (show: boolean) => void
  setShowInspector: (show: boolean) => void
  setLibrarySize: (size: number) => void
  setInspectorSize: (size: number) => void
  setPreviewSize: (size: number) => void
}

export const useUILayoutStore = create(
  persist<LayoutState>(
    (set) => ({
      showLibrary: true,
      showInspector: true,
      librarySize: 20,
      inspectorSize: 20,
      previewSize: 60,
      setShowLibrary: (show) => set({ showLibrary: show }),
      setShowInspector: (show) => set({ showInspector: show }),
      setLibrarySize: (size) => set({ librarySize: size }),
      setInspectorSize: (size) => set({ inspectorSize: size }),
      setPreviewSize: (size) => set({ previewSize: size }),
    }),
    { name: 'ui-layout' },
  ),
)

export default useUILayoutStore
