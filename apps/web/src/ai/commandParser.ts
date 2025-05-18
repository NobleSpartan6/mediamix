export interface SplitCommand {
  type: 'split'
  time: number
}

export interface DeleteCommand {
  type: 'delete'
  clipIndex: number
  ripple: boolean
}

export type TimelineCommand = SplitCommand | DeleteCommand

/**
 * Parse a natural language command describing an edit action.
 * Supported examples:
 *  - "split at 5s"
 *  - "delete clip 2"
 *  - "ripple delete clip 1"
 */
export function parseCommand(input: string): TimelineCommand | null {
  const trimmed = input.trim().toLowerCase()

  const splitMatch = trimmed.match(/^split at (\d+(?:\.\d+)?)s?$/)
  if (splitMatch) {
    return { type: 'split', time: parseFloat(splitMatch[1]) }
  }

  const deleteMatch = trimmed.match(/^(ripple )?delete clip (\d+)$/)
  if (deleteMatch) {
    return {
      type: 'delete',
      clipIndex: parseInt(deleteMatch[2], 10),
      ripple: !!deleteMatch[1],
    }
  }

  return null
}

import { useTimelineStore, selectClipsArray } from '../state/timelineStore'

/**
 * Execute a textual command against the timeline store.
 * Returns true if a command was recognized and applied.
 */
export function executeCommand(text: string): boolean {
  const cmd = parseCommand(text)
  if (!cmd) return false

  const store = useTimelineStore.getState()
  if (cmd.type === 'split') {
    store.splitClipAt(cmd.time)
    return true
  }

  if (cmd.type === 'delete') {
    const clips = selectClipsArray(store).sort((a, b) => a.start - b.start)
    const clip = clips[cmd.clipIndex - 1]
    if (clip) {
      store.removeClip(clip.id, { ripple: cmd.ripple })
      return true
    }
  }

  return false
}
