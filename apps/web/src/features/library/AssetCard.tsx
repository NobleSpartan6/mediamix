import React from 'react'
import type { MediaAsset } from '../../state/mediaStore'
import { useSelectionStore } from '../../state/selectionStore'

interface AssetCardProps {
  asset: MediaAsset
}

export function AssetCard({ asset }: AssetCardProps) {
  const handleDragStart = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/x-mediamix-asset', asset.id)
    },
    [asset.id],
  )

  const isVideo = asset.thumbnail !== undefined

  return (
    <div
      className="w-20 text-center text-xs select-none"
      draggable
      onDragStart={handleDragStart}
      onClick={() => useSelectionStore.getState().setSelection({ type: 'asset', id: asset.id })}
    >
      {isVideo ? (
        <img src={asset.thumbnail} alt="thumbnail" className="w-20 h-12 object-cover rounded mb-1" />
      ) : (
        <div className="w-20 h-12 flex items-center justify-center bg-panel-bg-secondary rounded mb-1">
          <span className="text-text-secondary">🎵</span>
        </div>
      )}
      <div className="truncate">{asset.fileName}</div>
    </div>
  )
}

export default AssetCard
