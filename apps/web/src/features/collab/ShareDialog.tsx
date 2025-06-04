import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useCollabStore } from '../../state/collabStore'

interface ShareDialogProps {
  onClose: () => void
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const [sessionIdInput, setSessionIdInput] = useState('')
  const createSession = useCollabStore((s) => s.createSession)
  const joinSession = useCollabStore((s) => s.joinSession)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 150)
  }

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in ${visible ? 'show' : ''}`}
    >
      <div
        className={`bg-panel-bg-secondary rounded p-6 w-80 space-y-4 fade-in ${visible ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Collaboration Options"
      >
        {createdId ? (
          <div>
            <p className="mb-2">Session ID:</p>
            <p className="font-mono break-all">{createdId}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button autoFocus onClick={() => setCreatedId(createSession())}>
              Create Session
            </Button>
            <div className="flex gap-2 items-center">
              <Input
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value)}
                className="flex-1 placeholder:text-text-secondary"
                placeholder="Session ID"
              />
              <Button onClick={() => joinSession(sessionIdInput)}>Join</Button>
            </div>
          </div>
        )}
        <div className="text-right">
          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

export default ShareDialog
