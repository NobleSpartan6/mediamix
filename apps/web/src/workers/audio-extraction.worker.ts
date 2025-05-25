// apps/web/src/workers/audio-extraction.worker.ts

import type { FFmpeg } from '@ffmpeg/ffmpeg';
// CreateFFmpegOptions might be inferred or part of the FFmpeg object methods

let ffmpegInstance: FFmpeg | null = null;

// We might need to define CreateFFmpegOptions locally if not exported
// or rely on the options parameter of createFFmpeg to be typed.
interface LocalCreateFFmpegOptions {
  log?: boolean;
  corePath?: string;
  // Add other options as needed based on @ffmpeg/ffmpeg documentation
}

async function getFFmpegInstance(): Promise<FFmpeg> {
  if (
    ffmpegInstance &&
    ((ffmpegInstance as any).isLoaded
      ? (ffmpegInstance as any).isLoaded()
      : (ffmpegInstance as any).loaded)
  ) {
    
    return ffmpegInstance;
  }

  
  const ffmpegConfig: LocalCreateFFmpegOptions = {
    log: true,
    // Resolve core path relative to the current origin so it also works when the
    // app is served from a sub-path (e.g. GitHub Pages).
    corePath: `${self.location.origin}/ffmpeg-core.js`,
  };

  // Dynamically import to avoid bundler tree-shaking issues and support v0.10 & v0.12 APIs
  const ffmpegModule = (await import('@ffmpeg/ffmpeg')) as any;

  if (ffmpegModule.createFFmpeg) {
    // v0.10 style API
    ffmpegInstance = ffmpegModule.createFFmpeg(ffmpegConfig) as FFmpeg;
  } else if (ffmpegModule.FFmpeg) {
    // v0.12+ API exposes FFmpeg class directly
    ffmpegInstance = new ffmpegModule.FFmpeg() as FFmpeg;
  } else {
    throw new Error('Neither createFFmpeg function nor FFmpeg class found in @ffmpeg/ffmpeg module.');
  }
  
  try {
    await (ffmpegInstance as any).load(ffmpegConfig);
    
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    ffmpegInstance = null;
    throw new Error('FFmpeg failed to load in worker.');
  }
  
  return ffmpegInstance;
}

// Define types for messages to and from the worker for clarity
interface ExtractAudioPayload {
  videoFile: File;
  outputFormat?: 'wav' | 'raw';
}

interface WorkerIncomingMessage {
  type: 'EXTRACT_AUDIO';
  payload: ExtractAudioPayload;
}

interface AudioExtractedMessage {
  type: 'AUDIO_EXTRACTED';
  audioData: ArrayBuffer;
  format: 'wav' | 'raw';
  sampleRate: number; // Hz
}

interface ErrorMessage {
  type: 'ERROR';
  error: string;
}

interface ProgressMessage {
  type: 'PROGRESS';
  progress: number;
}

// Provide minimal poly-type if lib dom doesn't include it
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type _DWGS = typeof globalThis & Worker;
const workerSelf = self as unknown as _DWGS;

// ---------------------------------------------------------------------------
// Compatibility helpers for different @ffmpeg/ffmpeg versions               
// ---------------------------------------------------------------------------

async function ffmpegWriteFile(ffmpeg: any, name: string, data: Uint8Array) {
  if (typeof ffmpeg.FS === 'function') {
    // v0.10 style API (sync)
    ffmpeg.FS('writeFile', name, data);
  } else if (typeof ffmpeg.writeFile === 'function') {
    // v0.12+ API (async)
    await ffmpeg.writeFile(name, data);
  } else {
    throw new Error('Current FFmpeg instance does not support writeFile operation.');
  }
}

async function ffmpegReadFile(ffmpeg: any, name: string): Promise<Uint8Array> {
  if (typeof ffmpeg.FS === 'function') {
    return ffmpeg.FS('readFile', name);
  }
  if (typeof ffmpeg.readFile === 'function') {
    return ffmpeg.readFile(name);
  }
  throw new Error('Current FFmpeg instance does not support readFile operation.');
}

function ffmpegUnlink(ffmpeg: any, name: string) {
  if (typeof ffmpeg.FS === 'function') {
    try {
      ffmpeg.FS('unlink', name);
    } catch {
      /* ignore */
    }
  } else if (typeof ffmpeg.unlink === 'function') {
    try {
      ffmpeg.unlink(name);
    } catch {
      /* ignore */
    }
  }
}

function attachProgressHandler(ffmpeg: any, cb: (ratio: number) => void) {
  if (typeof ffmpeg.setProgress === 'function') {
    // v0.10 style
    ffmpeg.setProgress(({ ratio }: { ratio: number }) => cb(ratio));
  } else if (typeof ffmpeg.on === 'function') {
    // v0.12+ style emits events
    ffmpeg.on('progress', ({ progress }: { progress: number }) => cb(progress));
  }
}

// Unified exec helper (run in v0.10, exec in v0.12)
async function ffmpegExec(ffmpeg: any, args: string[]) {
  if (typeof ffmpeg.run === 'function') {
    return ffmpeg.run(...args);
  }
  if (typeof ffmpeg.exec === 'function') {
    return ffmpeg.exec(args);
  }
  throw new Error('Current FFmpeg instance does not support run/exec operation.');
}

self.onmessage = async (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = event.data;

  if (type === 'EXTRACT_AUDIO') {
    const { videoFile, outputFormat = 'wav' } = payload;

    if (!videoFile) {
      workerSelf.postMessage({ type: 'ERROR', error: 'No video file provided.' } as ErrorMessage);
      return;
    }

    let ffmpeg: FFmpeg;
    try {
      ffmpeg = await getFFmpegInstance();
    } catch (error) {
      workerSelf.postMessage({ type: 'ERROR', error: (error as Error).message } as ErrorMessage);
      return;
    }

    try {
      const inputFileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const outputFileName = `output.${outputFormat}`;

      await ffmpegWriteFile(ffmpeg, inputFileName, new Uint8Array(await videoFile.arrayBuffer()));

      // Mandatory flags from Media-Handling hard rule
      const ffmpegArgs = [
        '-threads', '8',
        '-i', inputFileName,
        '-vn',
        '-vsync', '2',
      ];

      if (outputFormat === 'wav') {
        ffmpegArgs.push('-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1', outputFileName);
      } else {
         ffmpegArgs.push('-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1', '-f', 's16le', outputFileName);
      }
      
      
      attachProgressHandler(ffmpeg, (ratio: number) => {
        workerSelf.postMessage({ type: 'PROGRESS', progress: Math.max(0, Math.min(1, ratio)) } as ProgressMessage);
      });

      await ffmpegExec(ffmpeg, ffmpegArgs);

      const data = await ffmpegReadFile(ffmpeg, outputFileName);
      if (!data) {
        throw new Error(`Unable to read ${outputFileName} from FFmpeg FS`);
      }

      // Create a detached copy of the buffer to ensure it is structured-clonable
      const arrayBufferCopy = data.buffer.slice(0);

      const message: AudioExtractedMessage = { 
        type: 'AUDIO_EXTRACTED', 
        audioData: arrayBufferCopy, 
        format: outputFormat,
        sampleRate: 44100, // as enforced via -ar 44100
      };
      workerSelf.postMessage(message, [arrayBufferCopy]);

      ffmpegUnlink(ffmpeg, inputFileName);
      ffmpegUnlink(ffmpeg, outputFileName);

      if (ffmpeg) {
        ffmpegUnlink(ffmpeg, videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
        ffmpegUnlink(ffmpeg, `output.${outputFormat}`);
      }

    } catch (error) {
      console.error('Error during FFmpeg operation:', error);
      const errorMessage: ErrorMessage = { type: 'ERROR', error: (error as Error).message || 'Unknown error in FFmpeg operation' };
      workerSelf.postMessage(errorMessage);
    }
  }
};
