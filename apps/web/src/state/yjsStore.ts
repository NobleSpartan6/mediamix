import { create } from 'zustand'
import * as Y from 'yjs'
interface YjsState {
  doc: Y.Doc | null
  connected: boolean
  setConnected: (connected: boolean) => void
  setDoc: (doc: Y.Doc) => void
  applyUpdate: (update: Uint8Array) => void
}

const createDoc = () => new Y.Doc()
export const useYjsStore = create<YjsState>((set, get) => ({
  doc: null,
  connected: false,
  setConnected: (connected) => set({ connected }),
  setDoc: (doc) => set({ doc }),
  applyUpdate: (update) => {
    const { doc } = get()
    if (doc) Y.applyUpdate(doc, update)
  },
}))

export const initYjsStore = () => {
  const doc = createDoc()
  useYjsStore.setState({ doc, connected: true })
}
