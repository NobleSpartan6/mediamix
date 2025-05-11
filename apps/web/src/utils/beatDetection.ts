/*
 * Simple energy-based beat detector.
 * Input  : Mono PCM samples in the range [-1,1]
 * Output : Array of beat timestamps in seconds.
 * Algorithm: 
 * 1. Segment audio into frames (default 1024 samples).
 * 2. Compute short-term energy per frame.
 * 3. Maintain a running average energy over the previous window of frames (default 43 ≈1 s at 44.1 kHz).
 * 4. Emit a beat when current energy > threshold * average and separated by a refractoryGap.
 */

export interface BeatDetectionOptions {
  frameSize?: number;     // samples per frame
  historySize?: number;   // number of frames to average over
  energyThreshold?: number; // multiplier over average energy
  sensitivity?: number; // z-score multiplier over std dev
  refractoryGapSec?: number; // minimum spacing between beats
}

export function detectBeats(
  samples: Float32Array,
  sampleRate: number,
  {
    frameSize = 1024,
    historySize = 43,
    energyThreshold = 1.3,
    sensitivity = 1.5,
    refractoryGapSec = 0.25,
  }: BeatDetectionOptions = {},
): number[] {
  if (sampleRate <= 0) throw new Error('sampleRate must be > 0');
  const frameCount = Math.floor(samples.length / frameSize);
  const energies: number[] = new Array(frameCount);

  // 1. Compute energy per frame
  for (let i = 0; i < frameCount; i += 1) {
    let sum = 0;
    const offset = i * frameSize;
    for (let j = 0; j < frameSize; j += 1) {
      const s = samples[offset + j];
      sum += s * s;
    }
    energies[i] = sum / frameSize; // average energy
  }

  const beats: number[] = [];
  const refractoryGapFrames = Math.ceil((refractoryGapSec * sampleRate) / frameSize);
  let lastBeatFrame = -refractoryGapFrames - 1;

  // 2. Sliding window average and beat detection
  for (let i = 1; i < frameCount; i += 1) {
    // Determine how many frames we can look back (min(i, historySize))
    const histLen = i < historySize ? i : historySize;
    if (histLen === 0) continue; // skip first frame

    let histAvg = 0;
    for (let h = i - histLen; h < i; h += 1) histAvg += energies[h];
    histAvg /= histLen;

    // Compute standard deviation over history window
    let variance = 0;
    for (let h = i - histLen; h < i; h += 1) {
      const diff = energies[h] - histAvg;
      variance += diff * diff;
    }
    variance /= histLen;
    const stdDev = Math.sqrt(variance);

    const dynThreshold = histAvg + sensitivity * stdDev;

    // Safeguard for silence / extremely low stdDev
    const isBeat = stdDev < 1e-7 ? energies[i] > 0 : energies[i] > dynThreshold && energies[i] > energyThreshold * histAvg;
    if (isBeat && i - lastBeatFrame >= refractoryGapFrames) {
      const timeSec = (i * frameSize) / sampleRate;
      beats.push(timeSec);
      lastBeatFrame = i;
    }
  }

  return beats;
} 