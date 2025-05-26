import React from 'react'
import { useMediaStore } from '../../state/mediaStore'
import { useTimelineStore } from '../../state/timelineStore'
import { Button } from '../../components/ui/Button'
import { insertAssetToTimeline } from '../timeline/utils'

export default function MediaLibrary() {
  const assetsObject = useMediaStore((s) => s.assets)
  const assets = React.useMemo(() => Object.values(assetsObject), [assetsObject])
  const removeAsset = useMediaStore((s) => s.removeAsset)
  const removeClipsByAsset = useTimelineStore((s) => s.removeClipsByAsset)

  const handleAdd = (id: string) => {
    insertAssetToTimeline(id)
  }

  const handleRemove = (id: string) => {
    removeClipsByAsset(id)
    removeAsset(id)
  }

  if (assets.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-ui-body font-ui-medium text-accent">Media Library</h3>
      <ul className="space-y-2">
        {assets.map((asset) => (
          <li
            key={asset.id}
            className="flex items-center gap-2 p-2 bg-panel-bg rounded"
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData('text/x-mediamix-asset', asset.id)
            }
          >
            {asset.thumbnail && (
              <img
                src={asset.thumbnail}
                alt="thumbnail"
                className="w-10 h-10 object-cover rounded"
              />
            )}
            <div className="flex-1 overflow-hidden">
              <div className="text-xs text-gray-200 truncate">
                {asset.fileName}
              </div>
              <div className="text-xs text-gray-400">
                {asset.duration.toFixed(2)}s
              </div>
            </div>
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={() => handleAdd(asset.id)}
            >
              Add
            </Button>
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={() => handleRemove(asset.id)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
