import { useRef, useState, useEffect } from 'react'
import { TABLE_HEADER_H } from './tableScroll'

// Standar SEMUA table dashboard admin (lihat memory: dashboard-table-rules).
// - 2 lapis: LUAR rounded-2xl + overflow-hidden (sudut selalu bulat konsisten),
//   DALAM overflow-auto (scrollbar di dalam table).
// - viewport = header + 7.35 baris (7 penuh + 1 peeking). rowH diukur dari baris
//   pertama asli via ResizeObserver, fallback FALLBACK_ROW_H sebelum keukur.
// - -mr-4/-mb-4: sisakan 24px dari tepi kanan/bawah browser.
// - group/scroll + data-at-left/right: dipakai FreezeBlur* buat fade tepi kolom
//   freeze yang mati saat scroll horizontal sudah mentok.
const FALLBACK_ROW_H = 81
const VISIBLE_ROWS = 7.35

export function TableShell({ children, rows = VISIBLE_ROWS }) {
  const scrollRef = useRef(null)
  const [edge, setEdge] = useState({ atLeft: true, atRight: true })
  const [rowH, setRowH] = useState(FALLBACK_ROW_H)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const maxLeft = el.scrollWidth - el.clientWidth
      setEdge({ atLeft: el.scrollLeft <= 0, atRight: el.scrollLeft >= maxLeft - 1 })
      const firstRow = el.querySelector('tbody tr')
      if (firstRow?.offsetHeight) setRowH(firstRow.offsetHeight)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="-mr-4 -mb-4 rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden">
      <div
        ref={scrollRef}
        data-at-left={edge.atLeft}
        data-at-right={edge.atRight}
        className="group/scroll overflow-auto"
        style={{ maxHeight: TABLE_HEADER_H + rowH * rows }}
      >
        {children}
      </div>
    </div>
  )
}

// Strip blur di tepi DALAM kolom freeze. Taruh di dalam sel sticky yang diberi
// className 'relative'. Kiri: di sel sticky-kiri paling kanan. Kanan: di sel sticky-kanan.
export function FreezeBlurLeft() {
  return <span className="pointer-events-none absolute inset-y-0 right-0 w-6 translate-x-full bg-gradient-to-r from-black/10 to-transparent backdrop-blur-[1px] transition-opacity group-data-[at-left=true]/scroll:opacity-0" />
}
export function FreezeBlurRight() {
  return <span className="pointer-events-none absolute inset-y-0 left-0 w-6 -translate-x-full bg-gradient-to-l from-black/10 to-transparent backdrop-blur-[1px] transition-opacity group-data-[at-right=true]/scroll:opacity-0" />
}
