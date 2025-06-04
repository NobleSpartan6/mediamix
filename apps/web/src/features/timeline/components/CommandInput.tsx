import * as React from 'react'
import { executeCommand } from '../../../ai/commandParser'
import { Button } from '../../../components/ui/Button'

export const CommandInput: React.FC = () => {
  const [text, setText] = React.useState('')
  const [result, setResult] = React.useState<'success' | 'error' | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const ok = executeCommand(text)
    setResult(ok ? 'success' : 'error')
    setText('')
    window.setTimeout(() => setResult(null), 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <input
        className="flex-1 rounded bg-panel-bg-secondary text-text-primary text-sm px-2 py-1"
        placeholder="Enter command..."
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
      />
      <Button type="submit" variant="secondary" className="px-3 py-1">
        Run
      </Button>
      {result && (
        <span className={`text-sm ${result === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {result === 'success' ? 'Success' : 'Invalid command'}
        </span>
      )}
    </form>
  )
}

CommandInput.displayName = 'CommandInput'
