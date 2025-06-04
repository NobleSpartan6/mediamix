import { ReactNode } from 'react'

interface PanelProps {
  title: string
  onCollapse?: () => void
  children: ReactNode
  className?: string
}

export default function Panel({ title, onCollapse, children, className }: PanelProps) {
  return (
    <div className={`flex flex-col h-full rounded ${className ?? ''}`.trim()}>
      <div className="flex items-center justify-between px-2 py-2 bg-panel-bg-secondary border-b border-panel-bg">
        <span className="text-ui-body font-ui-semibold">{title}</span>
        {onCollapse && (
          <button type="button" onClick={onCollapse} className="text-xs hover:text-accent">
            &laquo;
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-2">{children}</div>
    </div>
  )
}

