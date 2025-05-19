import { create } from 'zustand'

interface YjsState {
  doc: unknown | null
  awareness: { states: Map<number, any> } | null
  connected: boolean
  setConnected: (connected: boolean) => void
  setDoc: (doc: unknown) => void
}

const createDoc = () => ({})
const createAwareness = () => ({ states: new Map<number, any>() })

export const useYjsStore = create<YjsState>((set) => ({
  doc: null,
  awareness: null,
  connected: false,
  setConnected: (connected) => set({ connected }),
  setDoc: (doc) => set({ doc }),
}))

export const initYjsStore = () => {
  const doc = createDoc()
  const awareness = createAwareness()
  useYjsStore.setState({ doc, awareness, connected: true })
}
