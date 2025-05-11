/*
 * beat-detection.worker.ts
 * Receives an ArrayBuffer of mono PCM Float32 samples and sampleRate.
 * Runs detectBeats and returns list of timestamps (seconds).
 */

import { detectBeats } from '../utils/beatDetection';

interface DetectBeatsMsg {
  type: 'DETECT_BEATS';
  payload: {
    samples: ArrayBuffer; // Float32 PCM
    sampleRate: number;
  };
}

interface BeatsDetectedMsg {
  type: 'BEATS_DETECTED';
  beats: number[]; // seconds
}

interface ErrorMsg {
  type: 'ERROR';
  error: string;
}

// Provide minimal poly-type if lib dom doesn't include it
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type _DWGS = typeof globalThis & Worker;
declare const self: _DWGS;

self.onmessage = (event: MessageEvent<DetectBeatsMsg>) => {
  const { type, payload } = event.data;
  if (type !== 'DETECT_BEATS') return;
  try {
    const { samples, sampleRate } = payload;
    const floatSamples = new Float32Array(samples);
    const beats = detectBeats(floatSamples, sampleRate);
    const msg: BeatsDetectedMsg = { type: 'BEATS_DETECTED', beats };
    // Transfer beats array underlying buffer to avoid copy – not large, but fine
    self.postMessage(msg);
  } catch (error) {
    const err: ErrorMsg = { type: 'ERROR', error: (error as Error).message };
    self.postMessage(err);
  }
}; 