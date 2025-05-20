import { WorkerWrapper } from './WorkerWrapper'

export interface ProxyProgressMessage {
  type: 'PROGRESS'
  progress: number
}

export interface ProxyDoneMessage {
  type: 'DONE'
  data: ArrayBuffer
}

export interface ProxyErrorMessage {
  type: 'ERROR'
  error: string
}

type ProxyWorkerMessage =
  | ProxyProgressMessage
  | ProxyDoneMessage
  | ProxyErrorMessage

let worker: WorkerWrapper | null = null

/**
 * Start a dedicated worker used for heavy transcoding tasks.
 */
export const initProxyWorker = (): WorkerWrapper => {
  if (!worker) {
    const url = new URL('./proxy.worker.ts', import.meta.url)
    worker = new WorkerWrapper(url)
  }
  return worker
}

export const generateProxy = (
  file: File,
  onProgress?: (p: number) => void,
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const w = initProxyWorker()

    w.onmessage = (e: MessageEvent<ProxyWorkerMessage>) => {
      const data = e.data
      if (data.type === 'PROGRESS') {
        onProgress?.(data.progress)
      } else if (data.type === 'DONE') {
        resolve(new Uint8Array(data.data))
      } else if (data.type === 'ERROR') {
        reject(new Error(data.error))
      }
    }

    w.onerror = (err) => {
      reject(new Error(err.message))
    }

    w.postMessage({ type: 'TRANSCODE', payload: { file } })
  })
}
