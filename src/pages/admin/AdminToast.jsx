export function AdminToast({ toast, onUndo }) {
  if (!toast) return null
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#0A1128] text-white px-6 py-3.5 rounded-full shadow-lg flex items-center gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
      <span className="text-sm font-light">{toast.message}</span>
      <button onClick={onUndo} className="text-sm text-gray-400 hover:text-white transition-colors">
        Batalkan
      </button>
    </div>
  )
}
