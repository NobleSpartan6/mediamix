// TODO(tauri-port): Implement metadata extraction in worker
self.onmessage = async (event) => {
  const handles = event.data
  console.log('metadata.worker received handles:', handles)
  // Placeholder: future implementation will extract VideoMetadata in worker thread
  self.postMessage([])
} 