// src/tests/beat-detection/detectBeatsFromVideo.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the modules to be mocked before using vi.mocked()
import { extractAudioTrack as actualExtractAudioTrack } from '../../lib/file/extractAudioTrack';
import ActualBeatDetectionWorker from '../../workers/beat-detection.worker.ts?worker';

// Mock for extractAudioTrack
vi.mock('../../lib/file/extractAudioTrack', () => ({
  extractAudioTrack: vi.fn().mockResolvedValue({
    audioData: new ArrayBuffer(1024),
    format: 'raw',
    sampleRate: 44100
  })
}));

// Mock the BeatDetectionWorker
const mockWorkerInstance = {
  onmessage: null as ((event: MessageEvent) => void) | null,
  onerror: null as ((event: ErrorEvent) => void) | null,
  postMessage: vi.fn(),
  terminate: vi.fn(),
};
vi.mock('../../workers/beat-detection.worker.ts?worker', () => ({
  default: vi.fn(() => mockWorkerInstance),
}));

// Cast the imported actual modules to their mocked versions for type safety and intellisense
const extractAudioTrackMock = vi.mocked(actualExtractAudioTrack);
const BeatDetectionWorkerMock = vi.mocked(ActualBeatDetectionWorker);

// Import the function under test AFTER mocking its dependencies
import { detectBeatsFromVideo } from '../../lib/file/detectBeatsFromVideo';

describe('detectBeatsFromVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerInstance.onmessage = null;
    mockWorkerInstance.onerror = null;
    // Mocks are reset via vi.clearAllMocks() if they are vi.fn()
    // extractAudioTrackMock is already a vi.fn() due to the vi.mock above.
    // BeatDetectionWorkerMock (the class mock) is also a vi.fn().

    // Re-set default resolved value for extractAudioTrackMock if needed for each test, 
    // though clearAllMocks also clears call history and specific mockImplementations.
    extractAudioTrackMock.mockResolvedValue({
      audioData: new ArrayBuffer(1024),
      format: 'raw',
      sampleRate: 44100
    });
  });

  it('resolves with beat timestamps and reports progress', async () => {
    const mockVideoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const mockProgressCallback = vi.fn();

    // Simulate worker sending back a success message
    // We need to do this after detectBeatsFromVideo is called and the worker instance is created
    // and has its onmessage handler assigned.
    const expectedBeats = [0.5, 1.0, 1.5, 2.0, 2.5];
    mockWorkerInstance.postMessage.mockImplementation(() => {
      // Check if onmessage is set before calling it
      if (mockWorkerInstance.onmessage) {
        // Simulate async worker behavior
        setTimeout(() => {
          if (mockWorkerInstance.onmessage) { // Check again inside timeout
            mockWorkerInstance.onmessage({
              data: { type: 'BEATS_DETECTED', beats: expectedBeats },
            } as MessageEvent);
          }
        }, 0);
      }
    });

    // Call the function with the progress callback in the correct position (second argument)
    const resultPromise = detectBeatsFromVideo(mockVideoFile, mockProgressCallback);
    
    // Wait for the promise to resolve
    const result = await resultPromise;
    
    expect(result).toEqual(expectedBeats);
    
    // Verify extractAudioTrack was called
    expect(extractAudioTrackMock).toHaveBeenCalledWith(
      mockVideoFile,
      'raw',
      expect.any(Function) // The internal progress callback for extractAudioTrack
    );

    // Verify progress callback from the test was called for 'extractAudio' stages
    expect(mockProgressCallback).toHaveBeenCalledWith('extractAudio', 0);
    // expect(mockProgressCallback).toHaveBeenCalledWith('extractAudio', expect.any(Number)); // Could be more specific
    expect(mockProgressCallback).toHaveBeenCalledWith('extractAudio', 1);
    
    // Verify worker was used
    expect(BeatDetectionWorkerMock).toHaveBeenCalledTimes(1);
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DETECT_BEATS' }),
      [expect.any(ArrayBuffer)] // The transferable object
    );
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);
  });

  it('rejects if worker sends an error message', async () => {
    const mockVideoFile = new File(['test'], 'error.mp4', { type: 'video/mp4' });
    const mockProgressCallback = vi.fn();
    const errorMessage = 'Worker failed';

    // Ensure the default mock implementation is in place for BeatDetectionWorkerMock for this test
    BeatDetectionWorkerMock.mockImplementation(() => mockWorkerInstance as any); 

    mockWorkerInstance.postMessage.mockImplementation(() => {
      if (mockWorkerInstance.onmessage) {
        setTimeout(() => {
          if (mockWorkerInstance.onmessage) {
            mockWorkerInstance.onmessage({
              data: { type: 'ERROR', error: errorMessage },
            } as MessageEvent);
          }
        }, 0);
      }
    });

    await expect(detectBeatsFromVideo(mockVideoFile, mockProgressCallback)).rejects.toThrow(errorMessage);
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);
  });

  it('rejects if worker itself throws an error', async () => {
    const mockVideoFile = new File(['test'], 'worker-error.mp4', { type: 'video/mp4' });
    const mockProgressCallback = vi.fn();
    const errorMessage = 'Critical worker failure';

    // Ensure the default mock implementation is in place for BeatDetectionWorkerMock for this test
    BeatDetectionWorkerMock.mockImplementation(() => mockWorkerInstance as any);

    mockWorkerInstance.postMessage.mockImplementation(() => {
      if (mockWorkerInstance.onerror) {
        setTimeout(() => {
          if (mockWorkerInstance.onerror) {
            mockWorkerInstance.onerror({ message: errorMessage } as ErrorEvent);
          }
        }, 0);
      }
    });

    await expect(detectBeatsFromVideo(mockVideoFile, mockProgressCallback)).rejects.toThrow(errorMessage);
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);
  });
});