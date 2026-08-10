import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { isStaging } from "@/lib/env";


// maxWidth default = lebar form 2-base desktop: mobile pakai max-w-md (cap lama,
// tak berpengaruh di layar sempit), lg → base 1366 (380px), fhd → base 1920 (480px).
// lockDesktop: diterima biar call-site lama gak error, tapi layout sekarang pakai
// document scroll (header sticky-top + CTA sticky-bottom) di mobile & desktop.
export function RightPanel({ children, mobileHero = null, topBar = null, stickyFooter = null, progress = null, maxWidth = 'max-w-md lg:max-w-[380px] fhd:max-w-[480px]', padX = '1', lockDesktop = false }) {
  // Kartu putih jadi "popup sheet" (rounded-top, naik menutupi hero) HANYA saat
  // ada hero ungu di atasnya. Halaman tanpa hero (signup/perbaikan) tampil polos.
  const sheet = !!mobileHero
  // App-shell (signup): header sticky atas + CTA sticky bawah. Aktif kalau ada stickyFooter.
  const appShell = !!stickyFooter

  // Document scroll (bukan container scroll) — hindari jebakan 100vh+nested-overflow
  // di mobile (lihat memory mobile-scroll-100vh-trap). Header sticky top-0 nempel
  // VIEWPORT jadi beneran fixed; CTA sticky bottom-0 selalu kelihatan.
  // Edge blur (ala table dashboard) pakai DOCUMENT scroll, bukan container:
  //  - atTop  → mentok atas, blur bawah-header mati
  //  - atBottom→ mentok bawah, blur atas-CTA mati
  // Wajib window.scrollY (bukan el.scrollTop) karena sekarang dokumen yang scroll.
  const [edge, setEdge] = useState({ atTop: true, atBottom: true })
  useEffect(() => {
    if (!appShell) return
    const onScroll = () => {
      const y = window.scrollY
      const atTop = y <= 1
      const atBottom =
        y + window.innerHeight >= document.documentElement.scrollHeight - 1
      setEdge((prev) =>
        prev.atTop === atTop && prev.atBottom === atBottom
          ? prev
          : { atTop, atBottom }
      )
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [appShell])

  return (
    <div className="flex-1 flex flex-col bg-background relative min-h-screen">
      {mobileHero}
      {topBar && (
        <div
          className={cn(
            "sticky top-0 z-20 shrink-0 w-full mx-auto bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75",
            maxWidth,
          )}
        >
          <div className={cn("pt-4 pb-4", padX)}>{topBar}</div>
          {/* Fill bar progress MOBILE (style lama), nempel bawah header. Desktop
              pakai StepProgress tersegmen di dalam topBar, jadi ini lg:hidden. */}
          {progress != null && (
            <div className="lg:hidden h-1.5 w-full overflow-hidden bg-black/[0.06]">
              <div
                className="h-full rounded-r-full bg-[#0033EC] transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                }}
              />
            </div>
          )}
          {/* Strip blur+fade konten yang lewat di bawah header. */}
          {appShell && (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-full h-5 z-10 bg-gradient-to-b from-background to-transparent backdrop-blur-[1.5px] transition-opacity duration-200",
                edge.atTop ? "opacity-0" : "opacity-100",
              )}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          "flex-1 flex flex-col justify-start lg:justify-center px-4 lg:px-16 pb-6 w-full mx-auto bg-background",
          maxWidth,
          sheet
            ? "relative z-10 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none shadow-[0_-12px_30px_rgba(0,0,0,0.10)] lg:shadow-none pt-6 lg:pt-12"
            : "pt-6 lg:pt-12",
        )}
      >
        {children}
      </div>
      {/* CTA sticky bawah: selalu kelihatan walau form panjang. Dulu prop ini
          diterima tapi ga pernah dirender → tombol Lanjutkan hilang. */}
      {stickyFooter && (
        <div
          className={cn(
            "sticky bottom-0 z-20 w-full mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:border-t-0",
            maxWidth,
          )}
        >
          {/* Strip blur konten yang lewat di atas footer. Mati saat mentok bawah. */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-full h-5 bg-gradient-to-t from-background to-transparent backdrop-blur-[1.5px] transition-opacity duration-200",
              edge.atBottom ? "opacity-0" : "opacity-100",
            )}
          />
          <div className="py-4 pb-6 px-4 lg:px-16">{stickyFooter}</div>
        </div>
      )}
      {/* Copyright + build = SATU sumber global di sini. Jangan render copyright
          lagi per-screen (dulu LoginPage kirim prop footer → dobel). */}
      <div className="pb-6">
        <p className="text-xs text-muted-foreground text-center">
          ©2026 Gasing Academy. All rights reserved.
        </p>
        {isStaging() && (
          <p className="mt-1 text-[11px] text-muted-foreground/60 text-center select-all">
            build{" "}
            {typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : "dev"}
          </p>
        )}
      </div>
    </div>
  );
}

export function Divider() {
  return <div className="flex items-center my-1"><div className="flex-1 h-px bg-border" /></div>
}
