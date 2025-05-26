import * as React from 'react'
import { useTransportStore } from '../../../state/transportStore'
import { Button } from '../../../components/ui/Button'

export const PlayPauseButton: React.FC = () => {
  const playRate = useTransportStore((s) => s.playRate)
  const setPlayRate = useTransportStore((s) => s.setPlayRate)
  const playing = playRate !== 0

  const handleClick = React.useCallback(() => {
    setPlayRate(playing ? 0 : 1)
  }, [playing, setPlayRate])

  return (
    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={handleClick}>
      {playing ? '⏸ Pause' : '▶ Play'}
    </Button>
  )
}

PlayPauseButton.displayName = 'PlayPauseButton'
