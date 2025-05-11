import * as React from 'react'
import { Slider } from '../../../components/ui/Slider'

interface ZoomSliderProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

/**
 * ZoomSlider – thin wrapper around Radix Slider that maps linear 0-1 slider values to
 * logarithmic zoom levels (pixels per second) for smooth zooming experience.
 */
export const ZoomSlider: React.FC<ZoomSliderProps> = ({ value, min = 20, max = 500, onChange }) => {
  // Convert zoom value (px/sec) to slider [0,1]
  const toSlider = React.useCallback(
    (z: number) => {
      const logMin = Math.log(min)
      const logMax = Math.log(max)
      return (Math.log(z) - logMin) / (logMax - logMin)
    },
    [min, max],
  )

  const fromSlider = React.useCallback(
    (t: number) => {
      const logMin = Math.log(min)
      const logMax = Math.log(max)
      return Math.exp(logMin + t * (logMax - logMin))
    },
    [min, max],
  )

  const sliderValue = React.useMemo(() => {
    const raw = toSlider(value) * 100
    // Align value with slider step (0.1) to avoid Radix rounding feedback loop
    const aligned = Math.round(raw * 10) / 10
    return [aligned]
  }, [value, toSlider])

  // Commit update only when user releases pointer/keyboard to avoid rapid loops
  const handleValueCommit = React.useCallback(
    (vals: number[]) => {
      const newZoom = fromSlider(vals[0] / 100)
      if (Math.abs(newZoom - value) > 0.5) {
        onChange(newZoom)
      }
    },
    [fromSlider, onChange, value],
  )

  return (
    <div className="flex items-center space-x-2 w-40">
      <span className="text-xs text-gray-400 w-8 text-right select-none">{Math.round(value)}</span>
      {(
        <Slider
          value={sliderValue}
          onValueCommit={handleValueCommit}
          min={0}
          max={100}
          step={0.1}
        />
      )}
    </div>
  )
}

ZoomSlider.displayName = 'ZoomSlider' 