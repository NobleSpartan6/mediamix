import { describe, it, expect } from 'vitest';
import { int16ToFloat32 } from '../../utils/pcm';

describe('int16ToFloat32', () => {
  it('converts int16 PCM to float [-1,1]', () => {
    // create buffer for two samples: -32768 and 32767
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt16(0, -32768, true);
    view.setInt16(2, 32767, true);

    const floats = int16ToFloat32(buffer);
    expect(floats.length).toBe(2);
    expect(floats[0]).toBeCloseTo(-1, 5);
    expect(floats[1]).toBeCloseTo(32767 / 32768, 5);
  });
}); 