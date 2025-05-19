import { WorkerWrapper } from './WorkerWrapper'

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
