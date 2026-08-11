import { X } from 'lucide-react'

// Toast "Login gagal" untuk 401 Invalid credentials.
// Figma: mobile 9047:63649 · desktop 9047:61004. Visual identik RateLimitBanner
// (pill merah, pojok atas tengah). Mobile: w penuh, 14px center WRAP, tanpa X.
// Desktop (sm:): satu baris nowrap 16px + tombol X.
export function LoginFailedToast({
  message = 'Login gagal. Silakan periksa kembali dan coba lagi.',
  onClose,
}) {
  return (
    <div className="pointer-events-none fixed top-6 left-0 right-0 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[358px] items-center justify-center gap-4 rounded-[100px] bg-[#EF4444] px-5 py-[10px] text-white shadow-[1px_1px_18px_3px_rgba(0,0,0,0.1)] animate-fade-in-up sm:w-auto sm:max-w-full sm:rounded-2xl sm:py-3">
        <p className="flex-1 text-center text-[14px] font-medium leading-[1.5] sm:flex-none sm:text-left sm:text-[16px] sm:whitespace-nowrap">
          {message}
        </p>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="hidden size-6 shrink-0 items-center justify-center text-white/90 transition-colors hover:text-white sm:flex"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
