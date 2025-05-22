import { create } from 'zustand'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

interface YjsState {
  doc: Y.Doc | null
  awareness: Awareness | null
  connected: boolean
  setConnected: (connected: boolean) => void
  setDoc: (doc: Y.Doc) => void
  applyUpdate: (update: Uint8Array) => void
  broadcastAwareness: (state: any) => void
}

const createDoc = () => new Y.Doc()
const createAwareness = (doc: Y.Doc) => new Awareness(doc)

export const useYjsStore = create<YjsState>((set, get) => ({
  doc: null,
  awareness: null,
  connected: false,
  setConnected: (connected) => set({ connected }),
  setDoc: (doc) => set({ doc }),
  applyUpdate: (update) => {
    const { doc } = get()
    if (doc) Y.applyUpdate(doc, update)
  },
  broadcastAwareness: (state) => {
    const { awareness } = get()
    awareness?.setLocalState(state)
  },
}))

export const initYjsStore = () => {
  const doc = createDoc()
  const awareness = createAwareness(doc)
  useYjsStore.setState({ doc, awareness, connected: true })
}
