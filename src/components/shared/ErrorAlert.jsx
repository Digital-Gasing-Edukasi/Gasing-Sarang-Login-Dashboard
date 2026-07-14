import { AlertCircle } from 'lucide-react'

export function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700 animate-fade-in">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
