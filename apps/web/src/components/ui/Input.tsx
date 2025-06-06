import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`h-8 rounded border border-panel-bg-secondary bg-panel-bg px-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel-bg disabled:opacity-40 ${className}`}
      {...props}
    />
  ),
)

Input.displayName = 'Input'

