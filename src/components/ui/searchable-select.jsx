import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────────────────────────────────────
// SearchableSelect — dropdown dengan filter teks, dibangun tanpa dependency
// baru (repo cuma punya @radix-ui/react-select, ga ada Popover/Command/cmdk).
//
//  • Desktop (lg+) → popover custom (portal), input cari SELALU aktif & auto-
//    focus pas dibuka → ngetik langsung filter list (bukan cuma "jump to
//    match"-nya Radix bawaan).
//  • Mobile (<lg)  → bottom-sheet (pola sama kayak Select mobile di
//    select.jsx). Input cari TIDAK auto-aktif saat sheet dibuka (hindari
//    keyboard mobile nongol tiba-tiba) — user harus tap ikon cari dulu buat
//    munculin & fokus input-nya (aksi disengaja, gantiin "hold").
//
// Kontrak props sama kayak Select: value, onValueChange. Tambahan: options
// array [{ value, label }] (bukan children SelectItem) karena list difilter
// on the fly.
// ────────────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const query = "(max-width: 1023px)"
  const [mobile, setMobile] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  )
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return mobile
}

const TRIGGER_CLS = cn(
  "flex h-11 w-full items-center justify-between rounded-full border border-input bg-background px-5 py-2 text-sm text-left",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-primary",
  "hover:border-gray-300",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
  "transition-all duration-200 cursor-pointer",
  "[&>span]:line-clamp-1"
)

export function SearchableSelect({
  value,
  onValueChange,
  options = [], // [{ value, label }]
  placeholder = "Pilih",
  searchPlaceholder = "Cari...",
  emptyText = "Tidak ada hasil.",
  disabled,
  className,
  triggerClassName,
  title,
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [searchActive, setSearchActive] = React.useState(false) // mobile only
  const triggerRef = React.useRef(null)
  const popRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const longPressTimer = React.useRef(null)
  const [pos, setPos] = React.useState(null)

  const selected = options.find((o) => String(o.value) === String(value))

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => String(o.label).toLowerCase().includes(q))
  }, [options, query])

  const measure = React.useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left, width: r.width })
  }, [])

  const openDropdown = () => {
    if (disabled) return
    measure()
    setQuery("")
    setSearchActive(false)
    setOpen(true)
  }

  const closeDropdown = React.useCallback(() => {
    setOpen(false)
    setQuery("")
    setSearchActive(false)
  }, [])

  const pick = (v) => {
    onValueChange?.(v)
    closeDropdown()
  }

  // Desktop: input cari auto-focus begitu popover kebuka → langsung bisa ngetik.
  React.useEffect(() => {
    if (open && !isMobile) {
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open, isMobile])

  // Mobile: search cuma fokus kalau baru diaktifkan lewat aksi disengaja.
  React.useEffect(() => {
    if (open && isMobile && searchActive) {
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open, isMobile, searchActive])

  // Desktop: klik luar / Escape → tutup. Reposisi saat resize/scroll.
  React.useEffect(() => {
    if (!open || isMobile) return
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (popRef.current?.contains(e.target)) return
      closeDropdown()
    }
    const onKey = (e) => {
      if (e.key === "Escape") closeDropdown()
    }
    const onReposition = () => measure()
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open, isMobile, closeDropdown, measure])

  // Mobile: kunci scroll body saat sheet terbuka.
  React.useEffect(() => {
    if (!isMobile || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, open])

  // Long-press alternatif buat aktifin search di mobile (selain tap ikon).
  const startLongPress = () => {
    cancelLongPress()
    longPressTimer.current = setTimeout(() => setSearchActive(true), 500)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const list = (
    <ul role="listbox" className="max-h-64 overflow-y-auto p-1">
      {filtered.length === 0 ? (
        <li className="px-3 py-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </li>
      ) : (
        filtered.map((o) => {
          const isSel = String(o.value) === String(value)
          return (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={isSel}
                onClick={() => pick(o.value)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isSel
                    ? "bg-[#EEF0FF] font-semibold text-[#1a0b3d]"
                    : "text-gray-700 hover:bg-accent"
                )}
              >
                {o.label}
              </button>
            </li>
          )
        })
      )}
    </ul>
  )

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onTouchStart={isMobile ? startLongPress : undefined}
        onTouchEnd={isMobile ? cancelLongPress : undefined}
        onTouchMove={isMobile ? cancelLongPress : undefined}
        className={cn(TRIGGER_CLS, triggerClassName)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("line-clamp-1 text-left", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && isMobile &&
        createPortal(
          <div className="fixed inset-0 z-[150] lg:hidden">
            <div
              className="absolute inset-0 bg-black/10 backdrop-blur-sm animate-in fade-in-0"
              onClick={closeDropdown}
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom duration-200">
              <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />
              <div className="flex shrink-0 items-center justify-between px-6 pt-3 pb-3">
                <h3 className="text-[17px] font-bold text-gray-900">
                  {title || placeholder}
                </h3>
                {!searchActive && (
                  <button
                    type="button"
                    aria-label="Cari"
                    onClick={() => setSearchActive(true)}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchActive && (
                <div className="shrink-0 px-4 pb-3">
                  <div className="flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                    {query && (
                      <button type="button" onClick={() => setQuery("")} aria-label="Hapus">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="h-px w-full shrink-0 bg-gray-200" />
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {list}
              </div>
            </div>
          </div>,
          document.body
        )}

      {open && !isMobile &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width ?? "auto" }}
            className="z-[150] overflow-hidden rounded-lg border border-input bg-background shadow-md animate-in fade-in-0 zoom-in-95"
          >
            <div className="border-b border-input p-2">
              <div className="flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            {list}
          </div>,
          document.body
        )}
    </div>
  )
}
