import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'
import { initYjsStore, useYjsStore } from '../../state/yjsStore'


describe('yjs store sync', () => {
  it('applies document updates', () => {
    initYjsStore()
    const other = new Y.Doc()
    const map = other.getMap<any>('data')
    map.set('foo', 'bar')

    const update = Y.encodeStateAsUpdate(other)
    useYjsStore.getState().applyUpdate(update)

    const doc = useYjsStore.getState().doc!
    expect(doc.getMap<any>('data').get('foo')).toBe('bar')
  })
})
