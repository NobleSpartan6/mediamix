import { describe, it, expect, vi } from 'vitest'

import { initProxyWorker } from '../workers/proxy'
import { segmentVideo } from '../export/segment'
import { registerShader, getShader } from '../gpu/registerShader'
import { aiSegment } from '../ai/segment'
import { readFileStream } from '../lib/fs'
import { initCache } from '../lib/cache'
import { useYjsStore, initYjsStore } from '../state/yjsStore'

const createHandle = (): FileSystemFileHandle => {
  return {
    getFile: () => Promise.resolve(new File(['hello'], 'f.txt')),
  } as unknown as FileSystemFileHandle
}

describe('Stub modules basic behaviour', () => {
  it('initialises proxy worker', () => {
    const worker = initProxyWorker()
    expect(worker).toBeDefined()
  })

  it('segments video via ffmpeg', async () => {
    const file = new File(['data'], 'in.mp4')
    const result = await segmentVideo(file, 0, 1)
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('registers shader sources', () => {
    registerShader('test', { vertex: 'v', fragment: 'f' })
    expect(getShader('test')).toEqual({ vertex: 'v', fragment: 'f' })
  })

  it('streams files from handle', async () => {
    const stream = await readFileStream(createHandle())
    expect(typeof stream.getReader).toBe('function')
  })

  it('initialises cache database', async () => {
    const db = await initCache()
    expect(db.name).toBe('media-cache')
    db.close()
  })

  it('calls segmentation API', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2]).buffer))
    const mask = await aiSegment(new Blob())
    expect(mask).toBeInstanceOf(Uint8Array)
    spy.mockRestore()
  })

  it('sets up yjs store', () => {
    initYjsStore()
    const { connected, doc } = useYjsStore.getState()
    expect(connected).toBe(true)
    expect(doc).not.toBeNull()
  })
})
