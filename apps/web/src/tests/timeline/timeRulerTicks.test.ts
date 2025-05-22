import { describe, it, expect } from 'vitest'
import { calculateTickSettings } from '../../features/timeline/components/TimeRuler'

describe('calculateTickSettings', () => {
  it('skips labels when spacing would be under 20px', () => {
    const pps = 0.25
    const { major, labelEvery } = calculateTickSettings(pps)
    expect(major * labelEvery * pps).toBeGreaterThanOrEqual(20)
    expect(labelEvery).toBeGreaterThan(1)
  })

  it('shows every label when spacing is sufficient', () => {
    const { labelEvery } = calculateTickSettings(100)
    expect(labelEvery).toBe(1)
  })
})
