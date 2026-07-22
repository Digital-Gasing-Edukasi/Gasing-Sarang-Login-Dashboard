// Toast admin — 1 warna: bg #030B1F, teks putih, Poppins 16px. CTA #B3B6BC.
// Tombol "Batalkan" hanya muncul kalau toast memang punya jalur undo
// (lihat handleUndoToast di AdminDashboardPage); toast info murni tanpa CTA.
export function AdminToast({ toast, onUndo }) {
  if (!toast) return null
  const hasUndo = !!(
    toast.undo || toast.roleUndo || toast.statusUndo ||
    toast.bulkStatusUndo || toast.riwayat || toast.users || toast.user
  )
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#030B1F] text-white px-6 py-3.5 rounded-full shadow-lg flex items-center gap-6 font-sans text-[16px] animate-in slide-in-from-top-4 fade-in duration-300">
      <span className="font-normal">{toast.message}</span>
      {hasUndo && (
        <button onClick={onUndo} className="font-medium text-[#B3B6BC] hover:text-white transition-colors">
          Batalkan
        </button>
      )}
    </div>
  )
}
