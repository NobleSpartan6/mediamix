import * as React from 'react'
import { useSelectionStore } from '../../state/selectionStore'
import { useTimelineStore } from '../../state/timelineStore'
import { useMediaStore } from '../../state/mediaStore'
import { Slider } from '../../components/ui/Slider'
import { Input } from '../../components/ui/Input'
import { Switch } from '../../components/ui/Switch'

export default function InspectorPanel() {
  const selection = useSelectionStore((s) => s.currentSelection)

  const clip = useTimelineStore(
    React.useCallback((s) => (selection?.type === 'clip' ? s.clipsById[selection.id] : null), [selection]),
  )
  const asset = useMediaStore(
    React.useCallback((s) => (selection?.type === 'asset' ? s.assets[selection.id] : null), [selection]),
  )
  const updateClip = useTimelineStore((s) => s.updateClip)

  if (!selection) {
    return <div className="text-ui-body text-text-secondary">Select a clip to edit properties</div>
  }

  if (selection.type === 'asset' && asset) {
    return (
      <div className="text-ui-body text-text-secondary space-y-2">
        <div className="font-ui-medium text-accent">Asset</div>
        <div>{asset.fileName}</div>
        <div>Duration: {asset.duration.toFixed(2)}s</div>
      </div>
    )
  }

  if (!clip) {
    return <div className="text-ui-body text-text-secondary">Select a clip to edit properties</div>
  }

  const [x, setX] = React.useState(clip.x)
  const [y, setY] = React.useState(clip.y)
  const [scale, setScale] = React.useState(clip.scale)
  const [rotation, setRotation] = React.useState(clip.rotation)
  const [volume, setVolume] = React.useState(clip.volume)
  const [muted, setMuted] = React.useState(clip.muted)

  React.useEffect(() => {
    setX(clip.x)
    setY(clip.y)
    setScale(clip.scale)
    setRotation(clip.rotation)
    setVolume(clip.volume)
    setMuted(clip.muted)
  }, [clip])

  React.useEffect(() => {
    const t = setTimeout(() => {
      updateClip(clip.id, { x, y, scale, rotation, volume, muted })
    }, 100)
    return () => clearTimeout(t)
  }, [clip.id, x, y, scale, rotation, volume, muted, updateClip])

  return (
    <div className="text-ui-body text-text-secondary space-y-4">
      <section>
        <h3 className="font-ui-medium text-accent mb-1">Transform</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <span className="w-12">X</span>
            <Input type="number" value={x} onChange={(e) => setX(parseFloat(e.target.value))} />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-12">Y</span>
            <Input type="number" value={y} onChange={(e) => setY(parseFloat(e.target.value))} />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-12">Scale</span>
            <Input type="number" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-12">Rotation</span>
            <Input type="number" value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} />
          </label>
        </div>
      </section>
      <section>
        <h3 className="font-ui-medium text-accent mb-1">Audio</h3>
        <label className="flex items-center gap-2">
          <span className="w-12">Volume</span>
          <Slider value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} min={0} max={100} />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-12">Mute</span>
          <Switch checked={muted} onChange={(e) => setMuted(e.target.checked)} />
        </label>
      </section>
      {clip.effects.length > 0 && (
        <section>
          <h3 className="font-ui-medium text-accent mb-1">Effects</h3>
          <div className="text-xs text-gray-400">No effects</div>
        </section>
      )}
    </div>
  )
}
