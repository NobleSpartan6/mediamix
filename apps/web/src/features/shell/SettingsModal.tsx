import { Button } from '../../components/ui/Button'
import { useState } from 'react'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [gpuEnabled, setGpuEnabled] = useState(false)
  const [collabEnabled, setCollabEnabled] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in show">
      <div className="bg-panel-bg-secondary rounded p-6 w-80">
        <h2 className="text-ui-heading font-ui-semibold mb-4">Settings</h2>
        <div className="space-y-2 text-ui-body">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gpuEnabled}
              onChange={(e) => setGpuEnabled(e.target.checked)}
              className="accent-accent"
            />
            <span>Enable GPU acceleration</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={collabEnabled}
              onChange={(e) => setCollabEnabled(e.target.checked)}
              className="accent-accent"
            />
            <span>Enable collaboration</span>
          </label>
        </div>
        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
