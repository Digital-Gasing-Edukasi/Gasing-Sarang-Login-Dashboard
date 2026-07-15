import { cn } from '@/lib/utils'

export function RightPanel({ children, mobileHero = null }) {
  // Kartu putih jadi "popup sheet" (rounded-top, naik menutupi hero) HANYA saat
  // ada hero ungu di atasnya. Halaman tanpa hero (signup/perbaikan) tampil polos.
  const sheet = !!mobileHero
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background overflow-y-auto">
      {mobileHero}
      <div
        className={cn(
          'flex-1 flex flex-col justify-start lg:justify-center px-6 lg:px-16 pb-8 max-w-md w-full mx-auto bg-background',
          sheet
            ? 'relative z-10 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none shadow-[0_-12px_30px_rgba(0,0,0,0.10)] lg:shadow-none pt-9 lg:pt-12'
            : 'pt-8 lg:pt-12'
        )}
      >
        {children}
      </div>
      <div className="pb-6">
        <p className="text-xs text-muted-foreground text-center">©2026 Gasing Academy. All rights reserved..</p>
      </div>
    </div>
  )
}

export function Divider() {
  return <div className="flex items-center my-1"><div className="flex-1 h-px bg-border" /></div>
}
