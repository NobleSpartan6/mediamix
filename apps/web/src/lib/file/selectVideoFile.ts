export interface SelectedVideo {
  file: File
  handle?: FileSystemFileHandle
}

/**
 * Opens a file picker (File-System-Access API preferred) and returns the selected video File.
 * Falls back to a hidden <input type="file"> when the API is unavailable.
 * Returns null if the user cancels.
 */
export async function selectVideoFile(): Promise<SelectedVideo[] | null> {
  // Prefer the newer File-System-Access API
  if ('showOpenFilePicker' in window) {
    try {
      // @ts-expect-error TS lib may not yet include the picker types
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [
          {
            description: 'Video Files',
            accept: {
              'video/mp4': ['.mp4'],
              'video/quicktime': ['.mov'],
              'video/*': ['.mp4', '.mov', '.mkv', '.webm'],
            },
          },
        ],
      })
      if (!handles || handles.length === 0) return null
      const selections = await Promise.all(
        handles.map(async (handle: any) => {
          const file = await handle.getFile()
          return { file, handle }
        })
      )
      return selections
    } catch (err: any) {
      // AbortError when user cancels — just return null
      if (err?.name === 'AbortError') return null
      throw err // rethrow others so caller can surface error
    }
  }

  // Fallback <input type="file">
  return new Promise<SelectedVideo[] | null>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.multiple = true
    input.style.display = 'none'

    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : []
      if (files.length > 0) {
        resolve(files.map((file) => ({ file })))
      } else {
        resolve(null)
      }
      document.body.removeChild(input)
    }

    input.onerror = (e) => {
      document.body.removeChild(input)
      reject(e)
    }

    document.body.appendChild(input)
    input.click()
  })
} 