export interface SelectedVideo {
  file: File
  handle?: FileSystemFileHandle
}

/**
 * Open a file picker allowing multiple video selections.
 * Falls back to a hidden <input> element when the File System Access API
 * is unavailable. Returns an empty array if the user cancels.
 */
export async function selectVideoFiles(): Promise<SelectedVideo[]> {
  if ('showOpenFilePicker' in window) {
    try {
      // @ts-expect-error Picker types may not exist yet
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [
          {
            description: 'Video Files',
            accept: {
              'video/mp4': ['.mp4'],
              'video/quicktime': ['.mov'],
              'video/x-matroska': ['.mkv'],
              'video/webm': ['.webm'],
            },
          },
        ],
      })
      const list = Array.isArray(handles) ? handles : [handles]
      return Promise.all(
        list.map(async (h) => ({ file: await h.getFile(), handle: h }))
      )
    } catch (err: any) {
      if (err?.name === 'AbortError') return []
      throw err
    }
  }

  return new Promise<SelectedVideo[]>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.mp4,.mov,.mkv,.webm,video/*'
    input.multiple = true
    input.style.display = 'none'

    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : []
      const selections = files.map((f) => ({ file: f }))
      resolve(selections)
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
