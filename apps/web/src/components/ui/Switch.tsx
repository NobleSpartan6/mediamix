import * as React from 'react'

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={`accent-accent w-4 h-4 ${className}`}
      {...props}
    />
  ),
)

Switch.displayName = 'Switch'
