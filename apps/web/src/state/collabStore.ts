import { create } from 'zustand'
import { nanoid } from '../utils/nanoid'
import { CollabProvider } from './collabProvider'
import { useTimelineStore } from './timelineStore'
import { encodeStateAsUpdate } from 'yjs'

interface CollabState {
  provider: CollabProvider | null
  sessionId: string | null
  connected: boolean
  createSession: () => string
  joinSession: (id: string) => void
  leaveSession: () => void
}

export const useCollabStore = create<CollabState>((set, get) => ({
  provider: null,
  sessionId: null,
  connected: false,
  createSession: () => {
    const id = nanoid()
    get().joinSession(id)
    return id
  },
  joinSession: (id) => {
    const provider = new CollabProvider(id)
    const map = provider.getMap<any>('timeline')
    let applying = false
    provider.doc.on('update', () => {
      if (applying) return
      applying = true
      const state = map.get('state')
      if (state) useTimelineStore.setState(state)
      applying = false
    })
    useTimelineStore.subscribe((s) => {
      if (applying) return
      map.set('state', s)
      const update = encodeStateAsUpdate(provider.doc)
      provider.doc.emit(update)
    })
    set({ provider, sessionId: id, connected: true })
  },
  leaveSession: () => {
    const { provider } = get()
    provider?.destroy()
    set({ provider: null, sessionId: null, connected: false })
  },
}))
