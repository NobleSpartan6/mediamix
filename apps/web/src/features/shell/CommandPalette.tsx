import React, { useEffect, useRef, useState } from 'react'
import { useCommandPaletteStore } from './commandPaletteStore'
import { useTimelineStore } from '../../state/timelineStore'
import { executeCommand as executeAI } from '../../ai/executeCommand'
import { useToast } from '../../components/Toast'

interface Action {
  id: string
  label: string
  run: () => void
}

const actions: Action[] = [
  {
    id: 'import',
    label: 'Import Media',
    run: () => alert('Import not implemented'),
  },
  {
    id: 'export',
    label: 'Export Video',
    run: () => alert('Export not implemented'),
  },
  {
    id: 'split',
    label: 'Split at Playhead',
    run: () => {
      const state = useTimelineStore.getState()
      state.splitClipAt(state.currentTime)
    },
  },
  {
    id: 'align',
    label: 'Align to Beat',
    run: () => {
      const state = useTimelineStore.getState()
      state.alignSelectedToBeat?.()
    },
  },
]

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const runAI = async (text: string) => {
    setRunning(true)
    try {
      const res = await executeAI(text)
      toast(res)
    } catch (err: any) {
      toast(err.message || 'Error')
    } finally {
      setRunning(false)
      setOpen(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[index]) {
        filtered[index].run()
        setOpen(false)
      } else if (query.trim()) {
        runAI(query.trim())
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-gray-800 w-96 rounded shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="w-full bg-gray-700 text-white px-3 py-2 outline-none"
          placeholder="Type a command or ask AI..."
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value)
            setIndex(0)
          }}
          onKeyDown={handleKey}
        />
        <ul className="max-h-60 overflow-y-auto">
          {filtered.map((a, i) => (
            <li
              key={a.id}
              className={`px-3 py-2 cursor-pointer ${
                i === index ? 'bg-accent text-white' : 'text-gray-200'
              }`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => {
                a.run()
                setOpen(false)
              }}
            >
              {a.label}
            </li>
          ))}
          {running && (
            <li className="px-3 py-2 text-gray-400">Thinking...</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default CommandPalette
