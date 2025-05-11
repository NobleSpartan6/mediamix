// src/tests/__mocks__/@ffmpeg/ffmpeg.js

// Import vitest functions for mocking
import { vi } from 'vitest';

// File system storage simulation for the mock
const fileSystem = new Map();

// Create mock buffer with specified size
const createMockBuffer = (size = 1024) => new Uint8Array(new ArrayBuffer(size));

// Mock implementation of FFmpeg
const createMockFFmpegInstance = () => {
  return {
    // Core functionality
    load: vi.fn().mockResolvedValue(undefined),
    loaded: true,
    isLoaded: vi.fn().mockReturnValue(true),
    
    // v0.10.x API
    run: vi.fn().mockImplementation((...args) => {
      console.log('Mock FFmpeg run called with:', args);
      return Promise.resolve();
    }),
    
    // v0.12.x+ API
    exec: vi.fn().mockImplementation((args) => {
      console.log('Mock FFmpeg exec called with:', args);
      
      // Add output.wav to the file system if requested
      if (args.includes('output.wav') || args.includes('output.raw')) {
        const outputFile = args.includes('output.wav') ? 'output.wav' : 'output.raw';
        fileSystem.set(outputFile, createMockBuffer());
      }
      
      return Promise.resolve();
    }),
    
    // v0.10.x file system
    FS: vi.fn().mockImplementation((command, filename, data) => {
      console.log(`Mock FFmpeg FS called: ${command} ${filename}`);
      
      switch (command) {
        case 'writeFile':
          fileSystem.set(filename, data || createMockBuffer());
          return;
        case 'readFile':
          if (!fileSystem.has(filename)) {
            fileSystem.set(filename, createMockBuffer());
          }
          return fileSystem.get(filename);
        case 'unlink':
          fileSystem.delete(filename);
          return;
        default:
          console.warn(`Unhandled FS command: ${command}`);
          return;
      }
    }),
    
    // v0.12.x+ file system
    writeFile: vi.fn().mockImplementation((filename, data) => {
      console.log(`Mock FFmpeg writeFile called: ${filename}`);
      fileSystem.set(filename, data || createMockBuffer());
      return Promise.resolve();
    }),
    
    readFile: vi.fn().mockImplementation((filename) => {
      console.log(`Mock FFmpeg readFile called: ${filename}`);
      if (!fileSystem.has(filename)) {
        fileSystem.set(filename, createMockBuffer());
      }
      return Promise.resolve(fileSystem.get(filename));
    }),
    
    unlink: vi.fn().mockImplementation((filename) => {
      console.log(`Mock FFmpeg unlink called: ${filename}`);
      fileSystem.delete(filename);
      return Promise.resolve();
    }),
    
    // Progress handlers
    setProgress: vi.fn().mockImplementation((callback) => {
      if (callback) {
        setTimeout(() => callback({ ratio: 1.0 }), 10);
      }
    }),
    
    on: vi.fn().mockImplementation((event, callback) => {
      if (event === 'progress' && callback) {
        setTimeout(() => callback({ progress: 1.0 }), 10);
      }
      return { off: vi.fn() }; // Return an object with off method for event cleanup
    }),
    
    off: vi.fn()
  };
};

// Mock constructor for FFmpeg class (v0.12.x+)
const FFmpegClass = vi.fn().mockImplementation(() => {
  return createMockFFmpegInstance();
});

// Mock factory function (v0.10.x)
const createFFmpeg = vi.fn().mockImplementation(() => {
  return createMockFFmpegInstance();
});

// Export both versions to support different import patterns
export { createFFmpeg, FFmpegClass as FFmpeg };

// Default export for 'import ffmpeg from "@ffmpeg/ffmpeg"' style imports
export default {
  createFFmpeg,
  FFmpeg: FFmpegClass
};