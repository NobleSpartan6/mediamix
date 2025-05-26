import React from 'react'
import { Button } from '../../components/ui/Button'
import Panel from '../../components/Panel'
import { useMediaStore, selectMediaArray, selectFolderArray } from '../../state/mediaStore'
import AssetCard from './AssetCard'
import { extractVideoMetadata } from '../../lib/file/extractVideoMetadata'
import { useUILayoutStore } from '../../state/uiLayoutStore'

async function pickFiles(): Promise<File[]> {
  if ('showOpenFilePicker' in window) {
    // @ts-ignore
    const handles = await window.showOpenFilePicker({ multiple: true })
    const list = Array.isArray(handles) ? handles : [handles]
    const files = await Promise.all(list.map((h: any) => h.getFile()))
    return files
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'video/*,audio/*'
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : []
      resolve(files)
      input.remove()
    }
    document.body.appendChild(input)
    input.click()
  })
}

export default function MediaLibraryPanel() {
  const assets = useMediaStore(selectMediaArray)
  const folders = useMediaStore(selectFolderArray)
  const addAssets = useMediaStore((s) => s.addAssets)
  const addFolder = useMediaStore((s) => s.addFolder)
  const setShowLibrary = useUILayoutStore((s) => s.setShowLibrary)

  const handleImport = async () => {
    const files = await pickFiles()
    if (files.length === 0) return
    const assetInputs = await Promise.all(
      files.map(async (file) => {
        const meta = await extractVideoMetadata(file)
        return { fileName: file.name, duration: meta?.duration ?? 0, file }
      }),
    )
    addAssets(assetInputs)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files: File[] = []
    if (e.dataTransfer.files) {
      files.push(...Array.from(e.dataTransfer.files))
    }
    if (files.length > 0) {
      const assetInputs = await Promise.all(
        files.map(async (file) => {
          const meta = await extractVideoMetadata(file)
          return { fileName: file.name, duration: meta?.duration ?? 0, file }
        }),
      )
      addAssets(assetInputs)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const name = window.prompt('Folder name?')
    if (name) addFolder(name)
  }


  const assetsByFolder = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    assets.forEach((a) => {
      const key = a.folderId ?? 'root'
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [assets])

  const renderFolder = (id: string, level: number): React.ReactNode => {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return null
    const children = folders.filter((f) => f.parentId === id)
    return (
      <div key={id} style={{ paddingLeft: level * 12 }} onContextMenu={handleContextMenu}>
        <div className="font-ui-medium text-sm mb-1">{folder.name}</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {(assetsByFolder[id] || []).map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
        {children.map((c) => renderFolder(c.id, level + 1))}
      </div>
    )
  }

  return (
    <Panel title="Media Library" className="h-full" onCollapse={() => setShowLibrary(false)}>
      <div className="mb-2">
        <Button onClick={handleImport}>Import Media</Button>
      </div>
      <div
        className="space-y-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {renderFolder('root', 0)}
      </div>
    </Panel>
  )
}
