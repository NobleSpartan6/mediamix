import React from 'react'
import type { MediaAsset } from '../../state/mediaStore'
import { useSelectionStore } from '../../state/selectionStore'

interface AssetCardProps {
  asset: MediaAsset
}

export function AssetCard({ asset }: AssetCardProps) {
  const handleDragStart = React.useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.setData('text/x-mediamix-asset', asset.id)
    },
    [asset.id],
  )

  const isVideo = asset.thumbnail !== undefined
  const isSelected = useSelectionStore(
    (s) => s.currentSelection?.type === 'asset' && s.currentSelection.id === asset.id,
  )

  return (
    <button
      type="button"
      className={`w-20 box-border text-center text-xs select-none rounded cursor-pointer hover:bg-panel-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isSelected ? 'border-2 border-accent' : 'border-2 border-transparent'}`}
      draggable
      onDragStart={handleDragStart}
      onClick={() =>
        useSelectionStore.getState().setSelection({ type: 'asset', id: asset.id })
      }
    >
      {isVideo ? (
        <img src={asset.thumbnail} alt="thumbnail" className="w-full h-12 object-cover rounded mb-1" />
      ) : (
        <div className="w-full h-12 flex items-center justify-center bg-panel-bg-secondary rounded mb-1">
          <span className="text-text-secondary">🎵</span>
        </div>
      )}
      <div className="truncate">{asset.fileName}</div>
    </button>
  )
}

export default AssetCard
