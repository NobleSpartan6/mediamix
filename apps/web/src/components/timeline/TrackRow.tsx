import * as React from 'react'
import { Lock, Unlock, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react'
import { type Track, useTimelineStore } from '../../stores/timelineStore'

interface TrackRowProps {
  track: Track
}

export const TrackRow: React.FC<TrackRowProps> = ({ track }) => {
  const updateTrack = useTimelineStore((s) => s.updateTrack)
  const isAudio = track.type === 'audio'

  const toggleLock = React.useCallback(() => {
    updateTrack(track.id, { locked: !track.locked })
  }, [updateTrack, track])

  const toggleMute = React.useCallback(() => {
    updateTrack(track.id, { muted: !track.muted })
  }, [updateTrack, track])

  const LockIcon = track.locked ? Lock : Unlock
  const MuteIcon = track.muted
    ? isAudio
      ? VolumeX
      : EyeOff
    : isAudio
      ? Volume2
      : Eye

  return (
    <div className="flex bg-neutral-800 border-b border-neutral-700 text-white">
      <div className="flex items-center justify-between w-48 px-2">
        <span className="text-xs">{track.name}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLock}
            aria-label={track.locked ? 'Unlock track' : 'Lock track'}
            className={track.locked ? 'opacity-50' : ''}
          >
            <LockIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={track.muted ? (isAudio ? 'Unmute track' : 'Show track') : (isAudio ? 'Mute track' : 'Hide track')}
            className={track.muted ? 'opacity-50' : ''}
          >
            <MuteIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative flex-1" />
    </div>
  )
}

TrackRow.displayName = 'TrackRow'
