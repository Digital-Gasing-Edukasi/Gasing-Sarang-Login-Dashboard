import { cn } from '@/lib/utils'
import logoSrc from '@/assets/logo-saranggasing.png'

// Ukuran logo (tinggi × lebar) sesuai aturan desain:
//   split  — layar desktop bergaya split (LeftPanel + konten): 48 × 105
//   full   — layar desktop tanpa split: 38 × 83, dipasang pojok kiri-atas (padding 24px)
//   mobile — 34 × 74, pojok kiri-atas (padding 16px). Hanya untuk layar yang
//            versi desktop-nya TIDAK split; halaman pembayaran manual memakai
//            tombol back, bukan logo.
const SIZE = {
  split: 'h-[48px] w-[105px]',
  full: 'h-[38px] w-[83px]',
  mobile: 'h-[34px] w-[74px]',
  // Dipakai pada layar yang logonya tampil di mobile maupun desktop non-split.
  responsive: 'h-[34px] w-[74px] lg:h-[38px] lg:w-[83px]',
}

export function Logo({ variant = 'full', className }) {
  return (
    <img
      src={logoSrc}
      alt="Sarang Gasing"
      draggable="false"
      className={cn('shrink-0 select-none object-contain object-left', SIZE[variant], className)}
    />
  )
}
