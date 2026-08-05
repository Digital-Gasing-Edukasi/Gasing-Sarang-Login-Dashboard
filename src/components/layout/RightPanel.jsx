import { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

// maxWidth default = lebar form 2-base desktop: mobile pakai max-w-md (cap lama,
// tak berpengaruh di layar sempit), lg → base 1366 (380px), fhd → base 1920 (480px).
export function RightPanel({ children, mobileHero = null, topBar = null, footer = null, stickyFooter = null, progress = null, maxWidth = 'max-w-md lg:max-w-[380px] fhd:max-w-[480px]', padX = 'px-6', lockDesktop = false }) {
  // Kartu putih jadi "popup sheet" (rounded-top, naik menutupi hero) HANYA saat
  // ada hero ungu di atasnya. Halaman tanpa hero (signup/perbaikan) tampil polos.
  const sheet = !!mobileHero
  // App-shell (signup mobile): header nempel atas + CTA nempel bawah + konten
  // scroll di tengah. Aktif kalau ada stickyFooter. Desktop tetap normal.
  const appShell = !!stickyFooter
  // lockDesktop: bawa pola app-shell ke DESKTOP juga (khusus signup). Header &
  // CTA diam, hanya title+body yang scroll. Title top-align jarak tetap dari
  // header (bukan di-tengah). Page lain (Fix/Otp/Login) tetap perilaku lama.
  const deskShell = appShell && lockDesktop

  // Edge blur: konten yang lewat di bawah header/footer sticky diberi strip
  // blur+fade (ala table dashboard). Mati saat scroll mentok di atas/bawah.
  const scrollRef = useRef(null)
  const [edge, setEdge] = useState({ atTop: true, atBottom: true })
  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atTop = el.scrollTop <= 1
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setEdge((prev) =>
      prev.atTop === atTop && prev.atBottom === atBottom ? prev : { atTop, atBottom }
    )
  }, [])
  useEffect(() => { measure() }) // recek tiap render (konten bisa berubah tinggi)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [measure])

  return (
    <div
      className={cn(
        'flex-1 flex flex-col bg-background',
        deskShell
          // Desktop app-shell: kunci 1 viewport di mobile & desktop.
          ? 'h-[100dvh] overflow-hidden'
          : sheet || appShell
          // Mobile: kunci tepat 1 viewport (100dvh). Desktop normal (scroll bila perlu).
          ? 'h-[100dvh] overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-y-auto'
          : 'min-h-screen overflow-y-auto'
      )}
    >
      {mobileHero}
      {topBar && (
        <div
          className={cn(
            'sticky top-0 z-20 shrink-0 w-full mx-auto bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75',
            maxWidth
          )}
        >
          <div className={cn('pt-4 pb-4', padX)}>{topBar}</div>
          {/* Fill bar progress MOBILE (style lama), nempel bawah header. Desktop
              pakai StepProgress tersegmen di dalam topBar, jadi ini lg:hidden. */}
          {progress != null && (
            <div className="lg:hidden h-1.5 w-full overflow-hidden bg-black/[0.06]">
              <div
                className="h-full rounded-r-full bg-[#0033EC] transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
              />
            </div>
          )}
          {/* Strip blur+fade konten yang lewat di bawah header (mobile). */}
          {appShell && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-full h-5 z-10 bg-gradient-to-b from-background to-transparent backdrop-blur-[1.5px] transition-opacity duration-200',
                !deskShell && 'lg:hidden',
                edge.atTop ? 'opacity-0' : 'opacity-100'
              )}
            />
          )}
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={appShell ? measure : undefined}
        className={cn(
          'flex flex-col justify-start w-full mx-auto bg-background',
          // Desktop biasa: konten di-tengah vertikal. lockDesktop: top-align
          // (title jarak tetap dari header), jadi lg:justify-center dilepas.
          !deskShell && 'lg:justify-center',
          // Sheet (login): card setinggi konten, hero yang mengisi sisa ruang.
          // Non-sheet: card flex-1 seperti biasa (footer nempel bawah).
          sheet ? 'flex-none lg:flex-1' : 'flex-1',
          // App-shell: konten jadi area scroll di antara header & CTA. Mobile
          // selalu; desktop hanya saat lockDesktop.
          appShell &&
            (deskShell
              ? 'min-h-0 overflow-y-auto'
              : 'min-h-0 overflow-y-auto lg:overflow-visible'),
          padX,
          maxWidth,
          sheet
            ? 'relative z-10 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none shadow-[0_-12px_30px_rgba(0,0,0,0.10)] lg:shadow-none pt-6 lg:pt-12'
            : appShell
            // lockDesktop: jarak title→header = 42px (desktop). pb=0 supaya
            // jarak body→cta murni ditentukan spacer di dalam konten.
            ? (deskShell ? 'pt-4 lg:pt-[42px]' : 'pt-4 lg:pt-12')
            : 'pt-8 lg:pt-12',
          appShell ? (deskShell ? 'pb-6 lg:pb-0' : 'pb-6 lg:pb-8') : 'pb-8'
        )}
      >
        {children}
      </div>
      {/* CTA nempel bawah (khusus mobile). Desktop pakai tombol inline di konten. */}
      {stickyFooter && (
        <div
          className={cn(
            'relative shrink-0 w-full mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-3 pb-6',
            // Desktop: default sembunyi (pakai tombol inline). lockDesktop: CTA
            // nempel bawah di desktop juga. pt-0 supaya jarak body→cta murni dari spacer.
            !deskShell && 'lg:hidden',
            deskShell && 'lg:pt-0 lg:pb-8',
            padX,
            maxWidth
          )}
        >
          {/* Strip blur+fade konten yang lewat di atas footer (mobile). */}
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-full h-5 z-10 bg-gradient-to-t from-background to-transparent backdrop-blur-[1.5px] transition-opacity duration-200',
              edge.atBottom ? 'opacity-0' : 'opacity-100'
            )}
          />
          {stickyFooter}
        </div>
      )}
      {/* Footer (copyright + build date) hanya desktop — mobile disembunyiin.
          Isi footer di-supply pemanggil (cuma LoginPage yang kirim). */}
      {footer && (
        <div className="hidden lg:block pb-6">
          {footer}
        </div>
      )}
    </div>
  )
}

export function Divider() {
  return <div className="flex items-center my-1"><div className="flex-1 h-px bg-border" /></div>
}
