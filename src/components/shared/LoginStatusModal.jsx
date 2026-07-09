import { Clock, UserSearch, ShieldAlert, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

// Modal blocking di atas halaman login untuk 3 skenario status akun.
// Gaya konsisten: ikon bulat ring dashed oranye, judul navy, deskripsi abu, pill button.
//
// type     → skenario mana yang ditampilkan.
// onClose  → tutup modal (dismiss / logout): membersihkan sesi & kembali ke form login.
// onRenew  → lanjut ke halaman langganan (hanya dipakai skenario 'expired').
const CONFIG = {
  pending: {
    icon: UserSearch,
    title: 'Kami Sedang Meninjau Akunmu',
    body: (
      <>
        <span className="font-semibold text-foreground">Akun kamu sedang kami tinjau maksimal dalam waktu 24 jam</span>{' '}
        untuk memastikan kamu sudah terdaftar sebagai Trainer di Gasing Academy.
        <br /><br />
        <span className="font-semibold text-foreground">Mohon cek email secara berkala</span>{' '}
        untuk status pengajuan akunmu.
      </>
    ),
    actions: [{ label: 'Oke', variant: 'primary', kind: 'close' }],
  },
  expired: {
    icon: Clock,
    title: 'Masa Berlangganan Berakhir',
    body: 'Masa berlangganan kamu telah habis. Ayo perbarui langgananmu untuk kembali mendapatkan akses ke Gasing Circle!',
    actions: [
      { label: 'Log Out', variant: 'outline', icon: LogOut, kind: 'close' },
      { label: 'Perbarui Langganan', variant: 'primary', kind: 'renew' },
    ],
  },
  suspended: {
    icon: ShieldAlert,
    title: 'Akun Kamu Ditangguhkan',
    body: 'Akunmu sedang ditangguhkan sementara sehingga tidak dapat diakses. Silakan hubungi admin Gasing Academy untuk informasi lebih lanjut.',
    actions: [{ label: 'Oke', variant: 'primary', kind: 'close' }],
  },
}

export function LoginStatusModal({ type, onClose, onRenew }) {
  const cfg = CONFIG[type]
  if (!cfg) return null
  const Icon = cfg.icon
  const run = (kind) => (kind === 'renew' ? onRenew?.() : onClose?.())

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl p-8 text-center animate-fade-in-up">
        {/* Ikon: ring dashed oranye + inner circle soft */}
        <div className="mx-auto mb-6 w-[68px] h-[68px] rounded-full border-2 border-dashed border-orange-300 flex items-center justify-center">
          <div className="w-[52px] h-[52px] rounded-full bg-orange-100 flex items-center justify-center">
            <Icon size={26} className="text-orange-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">{cfg.title}</h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">{cfg.body}</p>

        <div className="flex items-center gap-4">
          {cfg.actions.map((a) => {
            const BtnIcon = a.icon
            return (
              <button
                key={a.label}
                onClick={() => run(a.kind)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-full transition-colors',
                  a.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-200 bg-white text-foreground hover:bg-gray-50'
                )}
              >
                {BtnIcon && <BtnIcon size={18} />}
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
