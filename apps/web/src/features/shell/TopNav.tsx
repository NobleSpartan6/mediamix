import * as React from 'react'
import * as Menubar from '@radix-ui/react-menubar'
import { useResetStore } from '../../lib/store/hooks'
import { useUILayoutStore } from '../../state/uiLayoutStore'
import { useState } from 'react'
import ShareDialog from '../collab/ShareDialog'

export const TopNav: React.FC = () => {
  const reset = useResetStore()
  const showLibrary = useUILayoutStore((s) => s.showLibrary)
  const setShowLibrary = useUILayoutStore((s) => s.setShowLibrary)
  const showInspector = useUILayoutStore((s) => s.showInspector)
  const setShowInspector = useUILayoutStore((s) => s.setShowInspector)
  const [showShare, setShowShare] = useState(false)

  return (
    <Menubar.Root className="menubar bg-gray-900 text-ui-body font-ui-medium px-2">
      <Menubar.Menu>
        <Menubar.Trigger className="menubar-trigger">File</Menubar.Trigger>
        <Menubar.Content className="menubar-content">
          <Menubar.Item onClick={reset}>New</Menubar.Item>
          <Menubar.Item onClick={() => alert('Open not implemented')}>Open</Menubar.Item>
          <Menubar.Item onClick={() => alert('Save not implemented')}>Save</Menubar.Item>
          <Menubar.Item onClick={() => alert('Export not implemented')}>Export</Menubar.Item>
          <Menubar.Item onClick={() => setShowShare(true)}>Share…</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger className="menubar-trigger">Edit</Menubar.Trigger>
        <Menubar.Content className="menubar-content">
          <Menubar.Item onClick={() => alert('Undo not implemented')}>Undo</Menubar.Item>
          <Menubar.Item onClick={() => alert('Redo not implemented')}>Redo</Menubar.Item>
          <Menubar.Item onClick={() => alert('Cut not implemented')}>Cut</Menubar.Item>
          <Menubar.Item onClick={() => alert('Copy not implemented')}>Copy</Menubar.Item>
          <Menubar.Item onClick={() => alert('Paste not implemented')}>Paste</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger className="menubar-trigger">View</Menubar.Trigger>
        <Menubar.Content className="menubar-content">
          <Menubar.CheckboxItem checked={showLibrary} onClick={() => setShowLibrary(!showLibrary)}>
            Library Panel
          </Menubar.CheckboxItem>
          <Menubar.CheckboxItem checked={showInspector} onClick={() => setShowInspector(!showInspector)}>
            Inspector Panel
          </Menubar.CheckboxItem>
          <Menubar.Separator />
          <Menubar.Item onClick={() => alert('Zoom 50%')}>Zoom 50%</Menubar.Item>
          <Menubar.Item onClick={() => alert('Zoom 100%')}>Zoom 100%</Menubar.Item>
          <Menubar.Item onClick={() => alert('Zoom 200%')}>Zoom 200%</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger className="menubar-trigger">Help</Menubar.Trigger>
        <Menubar.Content className="menubar-content">
          <Menubar.Item onClick={() => alert('MediaMix prototype')}>About</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      {showShare && <ShareDialog onClose={() => setShowShare(false)} />}
    </Menubar.Root>
  )
}

export default TopNav
