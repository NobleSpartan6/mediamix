import { ReactNode, useState } from 'react'
import SettingsModal from './SettingsModal'
import { useUILayoutStore } from '../../state/uiLayoutStore'
import TopNav from './TopNav'
import MainToolbar from './MainToolbar'
import { Button } from '../../components/ui/Button'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-panel-bg text-text-primary">
      <TopNav />
      <MainToolbar />
      <Button
        type="button"
        variant="secondary"
        onClick={() => setShowSettings(true)}
        className="self-end m-2 px-2 py-1 text-sm"
      >
        Settings
      </Button>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export default AppShell
