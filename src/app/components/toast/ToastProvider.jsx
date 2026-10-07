import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import './ToastProvider.css'

const ToastContext = createContext(null)

const AUTO_DISMISS_MS = 4500

let nextToastId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message, tone = 'info') => {
      const id = nextToastId++
      setToasts((current) => [...current, { id, message, tone }])

      const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
      timersRef.current.set(id, timer)
    },
    [dismissToast],
  )

  const toast = useMemo(
    () => ({
      show: showToast,
      success: (message) => showToast(message, 'success'),
      error: (message) => showToast(message, 'error'),
      info: (message) => showToast(message, 'info'),
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            <span className="toast-message">{item.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
