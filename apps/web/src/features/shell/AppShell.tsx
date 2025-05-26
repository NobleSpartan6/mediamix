import { ReactNode, useState } from 'react'
import SettingsModal from './SettingsModal'
import { useUILayoutStore } from '../../state/uiLayoutStore'
import TopNav from './TopNav'
import MainToolbar from './MainToolbar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-panel-bg text-white">
      <TopNav />
      <MainToolbar />
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="self-end m-2 px-2 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
      >
        Settings
      </button>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export default AppShell

