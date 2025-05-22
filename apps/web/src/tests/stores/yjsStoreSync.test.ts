import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'
import { initYjsStore, useYjsStore } from '../../state/yjsStore'


describe('yjs store sync', () => {
  it('applies document and awareness updates', () => {
    initYjsStore()
    const other = new Y.Doc()
    const map = other.getMap<any>('data')
    map.set('foo', 'bar')

    const update = Y.encodeStateAsUpdate(other)
    useYjsStore.getState().applyUpdate(update)

    const doc = useYjsStore.getState().doc!
    expect(doc.getMap<any>('data').get('foo')).toBe('bar')

    useYjsStore.getState().broadcastAwareness({ user: 1 })
    const awareness = useYjsStore.getState().awareness!
    expect(awareness.states.get(0)).toEqual({ user: 1 })
  })
})
