import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

// Auto-dismiss ~3s, pola yang sama dengan LoginFailedToast. Tanpa onClose,
// toast menyembunyikan dirinya sendiri; dengan onClose, parent yang mengontrol
// (dipanggil saat durasi habis).
const AUTO_DISMISS_MS = 3000

export function SuccessToast({ message, onClose, duration = AUTO_DISMISS_MS }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => {
      if (onClose) onClose()
      else setVisible(false)
    }, duration)
    return () => clearTimeout(t)
  }, [onClose, duration, message])
  if (!visible) return null
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)] animate-fade-in">
      <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl">
        <span className="text-sm font-medium text-center break-words">{message}</span>
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <CheckCircle2 size={14} className="text-white" />
        </div>
      </div>
    </div>
  )
}
