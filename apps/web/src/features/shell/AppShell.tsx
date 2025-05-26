import { ReactNode, useState } from 'react'
import SettingsModal from './SettingsModal'
import { useUILayoutStore } from '../../state/uiLayoutStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [showSettings, setShowSettings] = useState(false)
  const showLibrary = useUILayoutStore((s) => s.showLibrary)
  const setShowLibrary = useUILayoutStore((s) => s.setShowLibrary)
  const showInspector = useUILayoutStore((s) => s.showInspector)
  const setShowInspector = useUILayoutStore((s) => s.setShowInspector)

  return (
    <div className="min-h-screen flex flex-col bg-panel-bg text-white">
      <nav className="bg-gray-900 px-4 py-2 flex items-center text-ui-body font-ui-medium">
        <span className="font-ui-semibold text-accent mr-6">MediaMix</span>
        <button type="button" onClick={() => alert('New project coming soon')} className="hover:text-accent mr-4">
          New
        </button>
        <button type="button" onClick={() => alert('Open not implemented')} className="hover:text-accent mr-4">
          Open
        </button>
        <button type="button" onClick={() => alert('Save not implemented')} className="hover:text-accent mr-4">
          Save
        </button>
        <button type="button" onClick={() => alert('Export not implemented')} className="hover:text-accent mr-4">
          Export
        </button>
        <details className="relative mr-4">
          <summary className="cursor-pointer hover:text-accent">View</summary>
          <div className="absolute left-0 mt-1 bg-gray-900 p-2 shadow z-10 space-y-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-accent"
                checked={showLibrary}
                onChange={(e) => setShowLibrary(e.target.checked)}
              />
              Library
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-accent"
                checked={showInspector}
                onChange={(e) => setShowInspector(e.target.checked)}
              />
              Inspector
            </label>
          </div>
        </details>
        <button type="button" onClick={() => setShowSettings(true)} className="hover:text-accent ml-auto">
          Settings
        </button>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export default AppShell
