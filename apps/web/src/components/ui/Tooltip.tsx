import * as React from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 w-max -translate-x-1/2 rounded bg-panel-bg-secondary px-2 py-1 text-text-secondary text-ui-caption opacity-0 transition-opacity group-hover:opacity-100">
        {content}
      </span>
    </span>
  )
}

