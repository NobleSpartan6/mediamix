import { create } from 'zustand'

interface TransportState {
  /** Playback rate (e.g., 1 = real-time, -1 = reverse, 0 = pause) */
  playRate: number
  /** Current playhead frame (integer, 0-based) */
  playheadFrame: number
  /** Set absolute playback rate */
  setPlayRate: (rate: number) => void
  /** Increment play rate by factor of 2 up to ±32 */
  stepShuttle: (direction: 1 | -1) => void
  /** Nudge playhead by a number of frames (positive or negative) */
  nudgeFrames: (delta: number) => void
}

export const useTransportStore = create<TransportState>((set) => ({
  playRate: 0,
  playheadFrame: 0,

  setPlayRate: (rate) => set({ playRate: rate }),

  stepShuttle: (direction) =>
    set((state) => {
      // if currently paused start at 1 or -1.
      let next = state.playRate === 0 ? direction : state.playRate * 2 * direction
      // clamp between -32 and 32
      next = Math.max(-32, Math.min(32, next))
      // if direction changed sign reset to direction * 1
      if (Math.sign(next) !== direction) next = direction
      return { playRate: next }
    }),

  nudgeFrames: (delta) =>
    set((state) => ({ playheadFrame: Math.max(0, state.playheadFrame + delta) })),
})) 