/**
 * Invoke an external API to perform video segmentation.
 */
export const aiSegment = async (image: Blob): Promise<Uint8Array> => {
  const res = await fetch('/api/segment', { method: 'POST', body: image })
  return new Uint8Array(await res.arrayBuffer())
}
