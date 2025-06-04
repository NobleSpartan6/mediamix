import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive'
  asChild?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-accent text-white hover:bg-accent/90',
  secondary: 'bg-panel-bg-secondary text-text-primary hover:bg-panel-bg',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className = '', variant = 'default', asChild = false, ...props }, ref) => {
  const Comp: any = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel-bg disabled:pointer-events-none disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      {...(props as any)}
    />
  )
})

Button.displayName = 'Button' 
