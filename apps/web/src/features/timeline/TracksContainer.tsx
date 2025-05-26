import * as React from 'react'
import type { Clip, Track } from '../../state/timelineStore'
import { Playhead } from './components/Playhead'
import { TrackRow } from './components/TrackRow'

interface TracksContainerProps {
  pixelsPerSecond: number
  scrollRef: React.RefObject<HTMLDivElement>
  tracks: Track[]
  laneMap: Map<number, Clip[]>
  duration: number
  beats: number[]
  inPoint: number | null
  outPoint: number | null
  playheadSeconds: number
  playing: boolean
  scrollLeft: number
  onBackgroundPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onScrubStart: (e: React.PointerEvent<HTMLDivElement>) => void
  onScroll: () => void
}

export const TracksContainer: React.FC<TracksContainerProps> = React.memo(
  ({
    pixelsPerSecond,
    scrollRef,
    tracks,
    laneMap,
    duration,
    beats,
    inPoint,
    outPoint,
    playheadSeconds,
    playing,
    scrollLeft,
    onBackgroundPointerDown,
    onScroll,
  }) => {
    const renderedTracks = React.useMemo(
      () =>
        tracks.map((track, laneIndex) => (
          <TrackRow
            key={track.id}
            laneIndex={laneIndex}
            clips={laneMap.get(laneIndex) ?? []}
            pixelsPerSecond={pixelsPerSecond}
            track={track}
            timelineRef={scrollRef}
          />
        )),
      [tracks, laneMap, pixelsPerSecond, scrollRef],
    )

    const trackAreaHeight = React.useMemo(
      () => tracks.reduce((sum, t) => sum + (t.type === 'video' ? 48 : 32), 0),
      [tracks],
    )

    return (
      <div className="relative flex-1" style={{ minHeight: trackAreaHeight }}>
        <div
          ref={scrollRef}
          className="relative h-full overflow-x-scroll bg-panel-bg cursor-grab"
          onPointerDown={onBackgroundPointerDown}
          onScroll={onScroll}
        >
          <div
            className="relative h-full flex flex-col"
            style={{ width: duration * pixelsPerSecond }}
          >
            {renderedTracks}
            {beats.map((b) => (
              <div
                key={b}
                className="absolute top-0 bottom-0 w-px bg-accent/20 pointer-events-none"
                style={{ transform: `translateX(${b * pixelsPerSecond}px)` }}
              />
            ))}
            {inPoint !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-green-400 pointer-events-none"
                style={{ transform: `translateX(${inPoint * pixelsPerSecond}px)` }}
              />
            )}
            {outPoint !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 pointer-events-none"
                style={{ transform: `translateX(${outPoint * pixelsPerSecond}px)` }}
              />
            )}
          </div>
        </div>
        <Playhead
          positionSeconds={playheadSeconds}
          pixelsPerSecond={pixelsPerSecond}
          height="100%"
          offsetX={scrollLeft}
          onPointerDown={onScrubStart as any}
          interactive={!playing}
        />
      </div>
    )
  },
)

TracksContainer.displayName = 'TracksContainer'
