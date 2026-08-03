import { useState, useRef, useEffect } from 'react'
import { Headphones, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

// Email admin default (mailto) — sama seperti TransferBankPage.
const ADMIN_EMAIL = import.meta.env.VITE_CONTACT_ADMIN || 'admin@gasingacademy.org'

function initials(name = '') {
  return (
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
  )
}

// Avatar profil di pojok kanan atas (halaman pilih paket & pembayaran).
// Klik avatar → dropdown: "Hubungi Kami" + "Logout".
//   user       : { name } / { profile: { namaLengkap } } — untuk inisial.
//   onSignOut  : handler logout (wajib).
//   onContact  : handler "Hubungi Kami" (opsional; default → mailto admin).
export function ProfileMenu({ user, onSignOut, onContact }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Tutup saat klik di luar / tekan Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleContact = () => {
    setOpen(false)
    if (onContact) onContact()
    else window.location.href = `mailto:${ADMIN_EMAIL}`
  }

  const handleLogout = () => {
    setOpen(false)
    onSignOut?.()
  }

  const name = user?.name || user?.profile?.namaLengkap || 'HK'

  // Isi menu (dipakai bersama dropdown desktop & bottom-sheet mobile).
  const items = (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={handleContact}
        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#FFFFFF] hover:bg-white/5 transition-colors"
      >
        <Headphones size={18} className="text-[#FFFFFF]" />
        Hubungi Kami
      </button>
      <div className="mx-3 border-t border-white/10" />
      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#ef4444] hover:bg-white/5 transition-colors"
      >
        <LogOut size={18} className="text-[#ef4444]" />
        Logout
      </button>
    </>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu profil"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ef4444] text-white text-sm font-semibold transition-transform hover:scale-105"
      >
        {initials(name)}
      </button>

      {open && (
        <>
          {/* Desktop: dropdown kanan-atas */}
          <div
            role="menu"
            className="absolute right-0 top-full mt-3 hidden w-[220px] rounded-2xl border border-white/10 bg-[#030B1F] py-1.5 text-left shadow-xl shadow-black/30 animate-fade-in-up z-50 lg:block"
          >
            {items}
          </div>

          {/* Mobile: bottom-sheet tinggi 152 (desain Figma iPhone base) */}
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in-0"
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="absolute inset-x-0 bottom-0 flex h-[152px] flex-col rounded-t-3xl bg-[#030B1F] pb-[env(safe-area-inset-bottom)] text-left shadow-[0_-8px_30px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-200"
            >
              <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />
              <div className="flex flex-1 flex-col justify-center py-1.5">
                {items}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
