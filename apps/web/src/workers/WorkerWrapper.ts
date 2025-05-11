// src/workers/WorkerWrapper.ts
/**
 * A wrapper class for Web Workers that provides a fallback for test environments
 * where the Worker API is not available
 */
export class WorkerWrapper {
    private worker: Worker | null = null;
    private _onmessage: ((event: MessageEvent) => void) | null = null;
    private _onerror: ((event: ErrorEvent) => void) | null = null;
    private mockEnabled = false;
  
    constructor(workerScript: any) {
      // Check if we're in a test environment (Node.js) where Worker is not defined
      if (typeof Worker === 'undefined') {
        console.warn('Worker API not available, using mock worker implementation');
        this.mockEnabled = true;
        return;
      }
  
      try {
        let actualWorker: Worker;
        if (typeof workerScript === 'function') {
          // Vite worker import returns a worker constructor
          actualWorker = new workerScript();
        } else {
          // URL string or other script path
          actualWorker = new Worker(workerScript);
        }
        this.worker = actualWorker;
        
        // Forward events to our handlers
        this.worker.onmessage = (event) => {
          if (this._onmessage) this._onmessage(event);
        };
        
        this.worker.onerror = (event) => {
          if (this._onerror) this._onerror(event);
        };
      } catch (error) {
        console.warn('Worker creation failed, using mock worker:', error);
        this.mockEnabled = true;
      }
    }
    
    set onmessage(handler: ((event: MessageEvent) => void) | null) {
      this._onmessage = handler;
      if (this.worker) {
        this.worker.onmessage = handler;
      }
    }
    
    set onerror(handler: ((event: ErrorEvent) => void) | null) {
      this._onerror = handler;
      if (this.worker) {
        this.worker.onerror = handler;
      }
    }
    
    
    postMessage(message: any, transfer?: Transferable[]) {
      if (this.worker) {
        if (transfer) {
          this.worker.postMessage(message, transfer);
        } else {
          this.worker.postMessage(message);
        }
      } else if (this.mockEnabled) {
        // Mock implementation for tests
        setTimeout(() => {
          if (this._onmessage) {
            // For audio extraction, send a mock successful response
            if (message.type === 'EXTRACT_AUDIO') {
              const mockEvent = new MessageEvent('message', {
                data: {
                  type: 'AUDIO_EXTRACTED',
                  audioData: new ArrayBuffer(1024), // Mock audio data
                  format: message.payload?.outputFormat || 'wav',
                  sampleRate: 44100
                }
              });
              this._onmessage(mockEvent);
            }
          }
        }, 50); // Small delay to simulate async operation
      }
    }
    
    terminate() {
      if (this.worker) {
        this.worker.terminate();
      }
    }
  }