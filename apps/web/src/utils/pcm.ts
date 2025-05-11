export function int16ToFloat32(buffer: ArrayBuffer): Float32Array {
  const view = new DataView(buffer);
  const length = buffer.byteLength / 2;
  const float32 = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const int16 = view.getInt16(i * 2, true); // little-endian
    float32[i] = int16 / 32768; // scale to [-1,1]
  }
  return float32;
} 