import React from 'react'
import { useMediaStore } from '../../state/mediaStore'
import { useTimelineStore } from '../../state/timelineStore'
import { Button } from '../../components/ui/Button'

export default function MediaLibrary() {
  const assetsObject = useMediaStore((s) => s.assets)
  const assets = React.useMemo(() => Object.values(assetsObject), [assetsObject])
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
      </ul>
    </div>
  )
}
