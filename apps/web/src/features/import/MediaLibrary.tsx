import React from 'react'
import { selectMediaArray, useMediaStore } from '../../state/mediaStore'
import { useTimelineStore } from '../../state/timelineStore'
import { Button } from '../../components/ui/Button'

export default function MediaLibrary() {
  const assets = useMediaStore(selectMediaArray)
  const removeAsset = useMediaStore((s) => s.removeAsset)
  const addClip = useTimelineStore((s) => s.addClip)
  const clipsById = useTimelineStore((s) => s.clipsById)
  const removeClip = useTimelineStore((s) => s.removeClip)

  const handleAdd = (id: string, duration: number) => {
    const maxLane = Object.values(clipsById).reduce((m, c) => Math.max(m, c.lane), -1)
    const baseLane = maxLane + 1
    addClip({ start: 0, end: duration, lane: baseLane, assetId: id })
    addClip({ start: 0, end: duration, lane: baseLane + 1, assetId: id })
  }

  const handleRemove = (id: string) => {
    Object.entries(clipsById).forEach(([cid, c]) => {
      if (c.assetId === id) {
        removeClip(cid)
      }
    })
    removeAsset(id)
  }

  if (assets.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-ui-body font-ui-medium text-accent">Media Library</h3>
      <ul className="space-y-2">
        {assets.map((asset) => (
          <li key={asset.id} className="flex items-center space-x-2">
            {asset.thumbnail && (
              <img
                src={asset.thumbnail}
                alt="thumb"
                className="w-12 h-8 object-cover rounded"
              />
            )}
            <span className="flex-1 text-sm">{asset.fileName}</span>
            <Button
              variant="secondary"
              onClick={() => handleAdd(asset.id, asset.duration)}
            >
              Add to Timeline
            </Button>
            <Button variant="secondary" onClick={() => handleRemove(asset.id)}>
              Remove
            </Button>
          </li>
        ))
      </ul>
    </div>
  )
}
