import { ReactNode, useState } from 'react'
import SettingsModal from './SettingsModal'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-panel-bg text-white">
      <nav className="bg-gray-900 px-4 py-2 flex items-center text-ui-body font-ui-medium">
        <span className="font-ui-semibold text-accent mr-6">MediaMix</span>
        <button
          type="button"
          onClick={() => alert('New project coming soon')}
          className="hover:text-accent mr-4"
        >
          New
        </button>
        <button
          type="button"
          onClick={() => alert('Open not implemented')}
          className="hover:text-accent mr-4"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => alert('Save not implemented')}
          className="hover:text-accent mr-4"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => alert('Export not implemented')}
          className="hover:text-accent mr-4"
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="hover:text-accent ml-auto"
        >
          Settings
        </button>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}

export default AppShell
