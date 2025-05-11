import { describe, it, expect } from 'vitest'

import { initProxyWorker } from '../workers/proxy'
import { segmentVideo } from '../export/segment'
import { registerShader } from '../gpu/registerShader'
import { aiSegment } from '../ai/segment'
import { readFileStream } from '../lib/fs'
import { initCache } from '../lib/cache'
import { useYjsStore } from '../state/yjsStore'

// Helper that runs the function and ensures it returns or executes without throwing
const assertNoThrow = (fn: () => unknown) => {
  expect(fn).not.toThrowError()
}

describe('Stub module imports', () => {
  it('should import and execute all stub functions without errors', () => {
    assertNoThrow(initProxyWorker)
    assertNoThrow(segmentVideo)
    assertNoThrow(registerShader)
    assertNoThrow(aiSegment)
    assertNoThrow(() => readFileStream(null as unknown as FileSystemFileHandle))
    assertNoThrow(initCache)

    // Zustand slice should be accessible
    const { connected } = useYjsStore.getState()
    expect(connected).toBe(false)
  })
}) 