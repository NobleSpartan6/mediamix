import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useUILayoutStore } from '../../state/uiLayoutStore'

const reset = () => {
  useUILayoutStore.setState({
    showLibrary: true,
    showInspector: true,
    librarySize: 20,
    inspectorSize: 20,
    previewSize: 60,
  })
}

describe('ui layout store', () => {
  beforeEach(() => reset())

  it('toggles visibility', () => {
    act(() => {
      useUILayoutStore.getState().setShowLibrary(false)
      useUILayoutStore.getState().setShowInspector(false)
    })
    expect(useUILayoutStore.getState().showLibrary).toBe(false)
    expect(useUILayoutStore.getState().showInspector).toBe(false)
  })

  it('updates sizes', () => {
    act(() => {
      useUILayoutStore.getState().setLibrarySize(30)
      useUILayoutStore.getState().setPreviewSize(40)
    })
    expect(useUILayoutStore.getState().librarySize).toBe(30)
    expect(useUILayoutStore.getState().previewSize).toBe(40)
  })
})
