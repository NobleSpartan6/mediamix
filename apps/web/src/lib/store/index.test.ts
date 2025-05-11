import { describe, it, expect, beforeEach } from 'vitest'
import useMotifStore from './index.ts'

// Ensure a fresh store state before each test
beforeEach(() => {
  useMotifStore.getState().resetState()
})

describe('useMotifStore', () => {
  it('sets and resets file info correctly', () => {
    // Update part of the store
    useMotifStore.getState().setFileInfo({ fileName: 'test.mp4' })

    // Verify the change
    expect(useMotifStore.getState().fileInfo.fileName).toBe('test.mp4')

    // Reset the state and confirm revert
    useMotifStore.getState().resetState()
    expect(useMotifStore.getState().fileInfo.fileName).toBeNull()
  })
}) 