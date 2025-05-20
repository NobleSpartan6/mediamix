// src/tests/file-import/video-import.integration.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import type { MotifState, FileInfo } from '../../lib/store/types';

// Mock modules BEFORE importing components
// Mock the store with a simple in-memory object

// Adjusted mockFile to align with FileInfo structure
const mockFileObject: FileInfo = {
  fileName: 'demo.mp4',
  fileSize: 1024,
  duration: 90,
  width: 1280,
  height: 720,
  videoCodec: 'avc1',
  audioCodec: 'mp4a',
  fileHandle: null,
  frameRate: 30,
  sampleRate: 44100,
  channelCount: 2,
  videoSupported: true,
  audioSupported: true,
};

// Initial state for FileInfo, all properties null or default
const initialFileInfo: FileInfo = {
  fileName: null,
  fileSize: null,
  duration: null,
  width: null,
  height: null,
  videoCodec: null,
  audioCodec: null,
  fileHandle: null,
  frameRate: null,
  sampleRate: null,
  channelCount: null,
  videoSupported: null,
  audioSupported: null,
};

// Global mock store that components can update
// Typed mockStoreData using a subset of MotifState relevant to these tests.
// It's important that the initial shape includes all keys that will be accessed or set.
let mockStoreData: Pick<
  MotifState,
  | 'fileInfo'
  | 'isFileLoading'
  | 'fileError'
  | 'beatMarkers'
  | 'isBeatDetectionRunning'
  | 'beatDetectionError'
  | 'beatDetectionProgress'
  | 'beatDetectionStage'
  | 'timeline'
  | 'isExporting'
  | 'exportProgress'
  | 'exportError'
> & { currentFile: FileInfo | null; mediaAssets: any[] } = {
  fileInfo: { ...initialFileInfo }, // Initialize with the full FileInfo structure
  isFileLoading: false,
  fileError: null,
  beatMarkers: [],
  isBeatDetectionRunning: false,
  beatDetectionError: null,
  beatDetectionProgress: 0,
  beatDetectionStage: 'idle',
  timeline: { clips: [], selectedClipIds: [], playheadPosition: 0, zoom: 1, duration: 0 },
  isExporting: false,
  exportProgress: 0,
  exportError: null,
  mediaAssets: [],
  currentFile: null,
};

// Mock actions that VideoImportButton expects
const mockSetFileInfo = vi.fn((newInfo) => {
  mockStoreData = {
    ...mockStoreData,
    fileInfo: { ...mockStoreData.fileInfo, ...newInfo },
    ...(newInfo.fileName && { currentFile: { ...mockStoreData.fileInfo, ...newInfo } }),
  };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetIsFileLoading = vi.fn((isLoading) => {
  mockStoreData = { ...mockStoreData, isFileLoading: isLoading };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetFileError = vi.fn((error) => {
  mockStoreData = { ...mockStoreData, fileError: error };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetIsBeatDetectionRunning = vi.fn((isRunning) => {
  mockStoreData = { ...mockStoreData, isBeatDetectionRunning: isRunning };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetBeatMarkers = vi.fn((markers) => {
  mockStoreData = { ...mockStoreData, beatMarkers: markers };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetBeatDetectionError = vi.fn((error) => {
  mockStoreData = { ...mockStoreData, beatDetectionError: error };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetBeatDetectionProgress = vi.fn((progress) => {
  mockStoreData = { ...mockStoreData, beatDetectionProgress: progress };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockSetBeatDetectionStage = vi.fn((stage) => {
  mockStoreData = { ...mockStoreData, beatDetectionStage: stage };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});
const mockAddMediaAsset = vi.fn((asset) => {
  const id = `asset-${mockStoreData.mediaAssets.length + 1}`;
  mockStoreData.mediaAssets = [
    ...mockStoreData.mediaAssets,
    { id, ...asset },
  ];
});
const mockResetStore = vi.fn(() => {
  mockStoreData = {
    fileInfo: { ...initialFileInfo },
    isFileLoading: false,
    fileError: null,
    beatMarkers: [],
    isBeatDetectionRunning: false,
    beatDetectionError: null,
    beatDetectionProgress: 0,
    beatDetectionStage: 'idle',
    timeline: { clips: [], selectedClipIds: [], playheadPosition: 0, zoom: 1, duration: 0 },
    isExporting: false,
    exportProgress: 0,
    exportError: null,
    mediaAssets: [],
    currentFile: null,
  };
  // vi.advanceTimersByTime(0); // Temporarily commented out
});

// This function will act as our mock `useMotifStore`
// CONVERTED TO FUNCTION DECLARATION FOR HOISTING
function mockUseMotifStore (selector?: (state: typeof mockStoreData & typeof mockActions) => any) {
  const allStateAndActions = {
    ...mockStoreData,
    // Actions need to be part of the object selectors can access
    setFileInfo: mockSetFileInfo,
    setIsFileLoading: mockSetIsFileLoading,
    setFileError: mockSetFileError,
    setIsBeatDetectionRunning: mockSetIsBeatDetectionRunning,
    setBeatMarkers: mockSetBeatMarkers,
    setBeatDetectionError: mockSetBeatDetectionError,
    setBeatDetectionProgress: mockSetBeatDetectionProgress,
    setBeatDetectionStage: mockSetBeatDetectionStage,
    addMediaAsset: mockAddMediaAsset,
    resetStore: mockResetStore,
  };

  if (typeof selector === 'function') {
    try {
      return selector(allStateAndActions);
    } catch (e) {
      console.error("Error in mock selector:", e);
      // To better mimic Zustand, if a selector fails, it might return undefined
      // or the selector itself might be designed to handle parts of the state not being there.
      // For robust testing, ensure mockStoreData and mockActions cover all expected paths.
      return undefined;
    }
  }
  // If no selector, return the whole state + actions (like the store instance)
  return allStateAndActions;
};

// Add a 'setState' method to our mock store, similar to Zustand's `set`
// This needs to be attached to the function object
mockUseMotifStore.setState = (updater: ((prevState: typeof mockStoreData) => Partial<typeof mockStoreData>) | Partial<typeof mockStoreData>) => {
  let newStateSlice: Partial<typeof mockStoreData>;
  if (typeof updater === 'function') {
    newStateSlice = updater(mockStoreData);
  } else {
    newStateSlice = updater; // Direct state object
  }
  mockStoreData = { ...mockStoreData, ...newStateSlice };
  // Propagate changes to a mock subscription system or advance timers if UI updates depend on it
  // For simplicity, direct modification is used here. Consider using vi.advanceTimersByTime if effects need to run.
  // vi.advanceTimersByTime(0); // Try to flush pending updates // Temporarily commented out from mockUseMotifStore.setState
};

// Define mock actions object for selectors
const mockActions = {
  setFileInfo: mockSetFileInfo,
  setIsFileLoading: mockSetIsFileLoading,
  setFileError: mockSetFileError,
  setIsBeatDetectionRunning: mockSetIsBeatDetectionRunning,
  setBeatMarkers: mockSetBeatMarkers,
  setBeatDetectionError: mockSetBeatDetectionError,
  setBeatDetectionProgress: mockSetBeatDetectionProgress,
  setBeatDetectionStage: mockSetBeatDetectionStage,
  addMediaAsset: mockAddMediaAsset,
  resetStore: mockResetStore,
};

mockUseMotifStore.getState = () => ({ ...mockStoreData, ...mockActions });


vi.mock('../../lib/store', () => ({
  __esModule: true,
  default: mockUseMotifStore, // Now mockUseMotifStore is hoisted
  // Mock named exports if VideoImportButton uses them, e.g., useFileState
  // However, VideoImportButton seems to use useFileState which itself calls useMotifStore.
  // So, ensuring the default mock (mockUseMotifStore) is correct should suffice.
  // If useFileState, useResetStore, useBeatDetection are separate named exports that *don't*
  // internally use useMotifStore, they would need explicit mocking here.
  // Based on the VideoImportButton code, they *do* use useMotifStore or are simple selectors.
}));

// Mock the custom hooks if they are not simple selectors from the default store export
// For example, if useFileState did more than just select, it would need its own mock.
// From VideoImportButton.tsx:
// const { isFileLoading, fileError, setFileInfo } = useFileState() -> implies useFileState returns an object
// const resetStore = useResetStore() -> implies useResetStore returns a function
// const { setIsBeatDetectionRunning, ... } = useBeatDetection() -> implies useBeatDetection returns an object

// Simplified approach: Assume these hooks select from the main store,
// so the default mock of useMotifStore needs to return the actions.

vi.mock('../../lib/store/hooks', async (importOriginal) => {
  const actualHooks = await importOriginal() as any;
  return {
    ...actualHooks, // Keep other hooks if any, or define all explicitly
    useFileState: () => ({
      isFileLoading: mockStoreData.isFileLoading,
      fileError: mockStoreData.fileError,
      fileInfo: mockStoreData.fileInfo,
      setFileInfo: mockSetFileInfo,
    }),
    useResetStore: () => mockResetStore,
    useBeatDetection: () => ({
      isBeatDetectionRunning: mockStoreData.isBeatDetectionRunning,
      beatMarkers: mockStoreData.beatMarkers,
      beatDetectionError: mockStoreData.beatDetectionError,
      beatDetectionProgress: mockStoreData.beatDetectionProgress,
      beatDetectionStage: mockStoreData.beatDetectionStage,
      setIsBeatDetectionRunning: mockSetIsBeatDetectionRunning,
      setBeatMarkers: mockSetBeatMarkers,
      setBeatDetectionError: mockSetBeatDetectionError,
      setBeatDetectionProgress: mockSetBeatDetectionProgress,
      setBeatDetectionStage: mockSetBeatDetectionStage,
    }),
  };
});

// Mock file operations
vi.mock('../../lib/file/selectVideoFile', () => ({
  selectVideoFile: () =>
    Promise.resolve({
      file: new File(['dummy'], 'demo.mp4', { type: 'video/mp4' }),
      handle: undefined,
    })
}));

vi.mock('../../lib/file/extractVideoMetadata', () => ({
  extractVideoMetadata: vi.fn() // Will be configured per test
}));

vi.mock('../../lib/file/checkCodecSupport', () => ({
  checkCodecSupport: () => Promise.resolve({
    videoSupported: true,
    audioSupported: true
  })
}));

// Mock beat detection to avoid Web Worker issues
vi.mock('../../lib/file/detectBeatsFromVideo', () => ({
  detectBeatsFromVideo: () => Promise.resolve([0.5, 1.0, 1.5, 2.0])
}));

// Import components after mocks
import VideoImportButton from '../../features/import/VideoImportButton';
import FileInfoCard from '../../features/import/FileInfoCard';

describe('Video import flow (integration)', () => {
  // Helper interface for mocked metadata
  interface ExtractedMetadata {
    duration: number;
    width: number;
    height: number;
    frameRate: number;
    videoCodec?: string | null;
    audioCodec?: string | null;
    sampleRate?: number | null;
    channelCount?: number | null;
  }

  // Helper function to create mock metadata objects
  const createMockMetadata = (overrides: Partial<ExtractedMetadata> = {}): ExtractedMetadata => ({
    duration: 90,
    width: 1280,
    height: 720,
    frameRate: 30,
    videoCodec: 'avc1',
    audioCodec: 'mp4a',
    sampleRate: 44100,
    channelCount: 2,
    ...overrides,
  });

  beforeEach(() => {
    // Reset the mock store before each test
    mockStoreData = {
      fileInfo: { ...initialFileInfo }, // Reset with the full FileInfo structure
      isFileLoading: false,
      fileError: null,
      beatMarkers: [],
      isBeatDetectionRunning: false,
      beatDetectionError: null,
      beatDetectionProgress: 0,
      beatDetectionStage: 'idle',
      timeline: { clips: [], selectedClipIds: [], playheadPosition: 0, zoom: 1, duration: 0 },
      isExporting: false,
      exportProgress: 0,
      exportError: null,
      mediaAssets: [],
      currentFile: null,
    };
    // vi.useFakeTimers(); // Temporarily commented out
  });

  afterEach(() => {
    // vi.runOnlyPendingTimers(); // Temporarily commented out
    // vi.useRealTimers(); // Temporarily commented out
  });
  
  it('updates the FileInfoCard after successful import', async () => {
    const { extractVideoMetadata } = await import('../../lib/file/extractVideoMetadata');
    (extractVideoMetadata as Mock).mockResolvedValue(createMockMetadata());

    const { rerender } = render(
      <>
        <VideoImportButton />
        <FileInfoCard />
      </>
    );

    const button = screen.getByRole('button', { name: /import video/i });
    fireEvent.click(button);
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(mockStoreData.isFileLoading).toBe(false);
    }, { timeout: 4800 });

    // After loading is false, check the rest of the state
    expect(mockStoreData.fileError).toBeNull();
    expect(mockStoreData.fileInfo.fileName).toBe('demo.mp4');
    expect(mockStoreData.fileInfo.duration).toBe(90);

    // Re-render after store update so FileInfoCard picks up new fileInfo
    rerender(
      <>
        <VideoImportButton />
        <FileInfoCard />
      </>
    );
    const fileNameInCard = await screen.findByText('demo.mp4');
    expect(fileNameInCard).toBeInTheDocument();
  }, 5000);

  it('handles video with no audio', async () => {
    const { extractVideoMetadata } = await import('../../lib/file/extractVideoMetadata');
    (extractVideoMetadata as Mock).mockResolvedValue(createMockMetadata({ audioCodec: null, sampleRate: null, channelCount: null }));

    const { rerender } = render(
      <>
        <VideoImportButton />
        <FileInfoCard />
      </>
    );

    const button = screen.getByRole('button', { name: /import video/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockStoreData.isFileLoading).toBe(false);
    }, { timeout: 4800 });

    // After loading is false, check the rest of the state
    expect(mockStoreData.fileError).toBeNull();
    expect(mockStoreData.fileInfo.fileName).toBe('demo.mp4');
    expect(mockStoreData.fileInfo.audioCodec).toBeNull();
    expect(mockStoreData.fileInfo.sampleRate).toBeNull();
    expect(mockStoreData.fileInfo.channelCount).toBeNull();
    
    // Re-render after store update so FileInfoCard picks up new fileInfo
    rerender(
      <>
        <VideoImportButton />
        <FileInfoCard />
      </>
    );
    const fileNameInCardNoAudio = await screen.findByText('demo.mp4');
    expect(fileNameInCardNoAudio).toBeInTheDocument();
  }, 5000);

  it('handles metadata extraction failure', async () => {
    const { extractVideoMetadata } = await import('../../lib/file/extractVideoMetadata');
    (extractVideoMetadata as Mock).mockRejectedValue(new Error('Failed to extract metadata'));
    
    render(
      <>
        <VideoImportButton />
        <FileInfoCard />
      </>
    );

    const button = screen.getByRole('button', { name: /import video/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockStoreData.isFileLoading).toBe(false);
    }, { timeout: 4800 });

    // After loading is false, check the error state
    expect(mockStoreData.fileError).toBe('Failed to extract metadata');
    // Due to resetStore() being called in the error path before setFileError(),
    // fileInfo should be reset to its initial state.
    expect(mockStoreData.fileInfo.fileName).toBeNull();
    expect(mockStoreData.fileInfo.duration).toBeNull();
    // Optionally, verify FileInfoCard behavior on error, e.g.:
    // expect(screen.queryByText('demo.mp4')).toBeNull();
    // if (screen.queryByText(/Failed to extract metadata/i)) { // Check if error message is rendered by FileInfoCard or VideoImportButton
    //   expect(screen.getByText(/Failed to extract metadata/i)).toBeInTheDocument();
    // }
  }, 5000);
});