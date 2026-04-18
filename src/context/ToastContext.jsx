import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Toast } from '../components/ui/Toast'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, variant = 'success') => {
    setToast({ message, variant, id: Date.now() })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {toast ? <Toast key={toast.id} message={toast.message} variant={toast.variant} /> : null}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast outside ToastProvider')
  return ctx
}
