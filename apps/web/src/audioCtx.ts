let ctx: AudioContext | null = null
if (typeof window !== 'undefined' && typeof AudioContext !== 'undefined') {
  ctx = new AudioContext()
}
export const audioCtx = ctx
export default audioCtx

