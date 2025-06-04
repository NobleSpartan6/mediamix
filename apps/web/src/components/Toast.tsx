import React from 'react'

interface Toast {
  id: number
  message: string
}

const ToastContext = React.createContext<(msg: string) => void>(() => {})
let globalToast: ((msg: string) => void) | null = null

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((message: string) => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 3000)
  }, [])

  React.useEffect(() => {
    globalToast = addToast
    return () => {
      if (globalToast === addToast) globalToast = null
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 z-50">
          {toasts.map((t) => (
            <div key={t.id} className="bg-panel-bg-secondary text-text-primary px-4 py-2 rounded shadow">
              {t.message}
            </div>
          ))}
        </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => React.useContext(ToastContext)
export const toast = (msg: string) => {
  globalToast?.(msg)
}


