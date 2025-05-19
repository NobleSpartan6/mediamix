self.onmessage = (event) => {
  const { type } = event.data
  if (type === 'TRANSCODE') {
    self.postMessage({ type: 'DONE' })
  }
}
