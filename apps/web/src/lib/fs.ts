export const readFileStream = async (fileHandle: FileSystemFileHandle): Promise<ReadableStream<Uint8Array>> => {
  const file = await fileHandle.getFile()
  if ('stream' in file) {
    return (file as any).stream() as ReadableStream<Uint8Array>
  }
  return new Response(file).body as ReadableStream<Uint8Array>
}
