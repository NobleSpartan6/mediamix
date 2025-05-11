import { create } from 'zustand'

interface YjsState {
  // Placeholder for future Yjs shared state integration
  doc: unknown | null
  connected: boolean

  // Actions
  setConnected: (connected: boolean) => void
  setDoc: (doc: unknown) => void
}

export const useYjsStore = create<YjsState>((set) => ({
  doc: null,
  connected: false,

  setConnected: (connected) => set({ connected }),
  setDoc: (doc) => set({ doc }),
}))

// TODO(tauri-port): Replace this Zustand slice with actual Yjs CRDT store integration 