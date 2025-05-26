import * as React from 'react'

interface ContextProps {
  open: boolean
  setOpen: (v: boolean) => void
}
const MenuContext = React.createContext<ContextProps | null>(null)

export const Root: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div role="menubar" className={`flex items-center ${className}`} {...props}>
    {children}
  </div>
)

export const Menu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  )
}

export const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = '', onClick, ...props }, ref) => {
    const ctx = React.useContext(MenuContext)
    if (!ctx) return null
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      ctx.setOpen(!ctx.open)
      onClick?.(e)
    }
    return (
      <button
        ref={ref}
        className={`px-3 py-1 hover:bg-accent/30 data-[open=true]:bg-accent/50 ${className}`}
        data-open={ctx.open ? 'true' : undefined}
        onClick={handleClick}
      >
        {props.children}
      </button>
    )
  },
)

Trigger.displayName = 'Trigger'

export const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', style, ...props }, ref) => {
    const ctx = React.useContext(MenuContext)
    if (!ctx || !ctx.open) return null
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) ctx.setOpen(false)
    }
    return (
      <div
        ref={ref}
        tabIndex={-1}
        onBlur={handleBlur}
        className={`absolute left-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow z-20 p-1 ${className}`}
        {...props}
      />
    )
  },
)

Content.displayName = 'Content'

export const Item = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', onClick, ...props }, ref) => {
    const ctx = React.useContext(MenuContext)
    const handleSelect = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      ctx?.setOpen(false)
    }
    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={0}
        onClick={handleSelect}
        className={`px-2 py-1 text-sm cursor-pointer select-none hover:bg-accent/30 ${className}`}
        {...props}
      />
    )
  },
)

Item.displayName = 'Item'

export const CheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { checked?: boolean }
>(({ className = '', checked, children, onClick, ...props }, ref) => {
  const ctx = React.useContext(MenuContext)
  const handleSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    ctx?.setOpen(false)
  }
  return (
    <div
      ref={ref}
      role="menuitemcheckbox"
      tabIndex={0}
      onClick={handleSelect}
      className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer select-none hover:bg-accent/30 ${className}`}
      {...props}
    >
      <input type="checkbox" className="accent-accent" checked={checked} readOnly />
      {children}
    </div>
  )
})

CheckboxItem.displayName = 'CheckboxItem'

export const Separator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px my-1 bg-gray-700 ${className}`} />
)
