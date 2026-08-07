import { CheckCircle2 } from 'lucide-react'

export function SuccessToast({ message }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl animate-fade-in whitespace-nowrap">
      <span className="text-sm font-medium">{message}</span>
      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <CheckCircle2 size={14} className="text-white" />
      </div>
    </div>
  )
}
