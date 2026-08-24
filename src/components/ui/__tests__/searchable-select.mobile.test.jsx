import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchableSelect } from "@/components/ui/searchable-select";

// Regresi: search input mobile TIDAK auto-aktif saat sheet dibuka (hindari
// keyboard mobile nongol tiba-tiba) — cuma tampil/fokus setelah user tap ikon
// cari. Desktop tetap auto-focus langsung (behavior lama, existing test file
// searchable-select.test.jsx sudah cover 4 kasus dasar desktop — di sini kita
// tambah kasus yang belum ada: mobile-vs-desktop search-activation.
//
// CATATAN (sudah diketahui/di-flag teammate): long-press asli via touch tidak
// bisa disimulasikan jsdom secara realistis (timer + koordinat sentuh nyata) —
// itu perlu manual device testing. Test di sini fokus ke jalur tap-ikon yang
// bisa diverifikasi murni lewat DOM/jsdom.

const options = [
  { value: "1", label: "KAB. BOGOR" },
  { value: "2", label: "KOTA BANDUNG" },
]

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe("SearchableSelect — mobile vs desktop search activation", () => {
  afterEach(() => {
    // Balikin ke default stub (matches:false / desktop) dari vitest.setup.js.
    mockMatchMedia(false)
  })

  it("mobile: search input TIDAK tampil begitu sheet dibuka (default)", () => {
    mockMatchMedia(true) // "(max-width: 1023px)" match → mobile
    render(
      <SearchableSelect value="" onValueChange={() => {}} options={options} placeholder="Pilih Daerah" />
    )
    fireEvent.click(screen.getByRole("button", { name: /pilih daerah/i }))

    // Sheet terbuka (opsi terlihat) tapi search input belum ada di DOM.
    expect(screen.getByRole("option", { name: "KAB. BOGOR" })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Cari...")).not.toBeInTheDocument()
    // Ikon "Cari" tersedia buat aktivasi manual.
    expect(screen.getByRole("button", { name: "Cari" })).toBeInTheDocument()
  })

  it("mobile: tap ikon Cari → search input muncul & bisa dipakai (aksi disengaja)", () => {
    mockMatchMedia(true)
    render(
      <SearchableSelect value="" onValueChange={() => {}} options={options} placeholder="Pilih Daerah" />
    )
    fireEvent.click(screen.getByRole("button", { name: /pilih daerah/i }))
    fireEvent.click(screen.getByRole("button", { name: "Cari" }))

    const search = screen.getByPlaceholderText("Cari...")
    expect(search).toBeInTheDocument()
    // requestAnimationFrame dipakai buat auto-focus setelah searchActive — jsdom
    // jalanin rAF via macrotask, cukup assert elemen ada & bisa menerima input.
    fireEvent.change(search, { target: { value: "bogor" } })
    expect(screen.getByRole("option", { name: "KAB. BOGOR" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "KOTA BANDUNG" })).not.toBeInTheDocument()
  })

  it("desktop: search input tampil begitu dropdown dibuka (tanpa aksi tambahan)", () => {
    mockMatchMedia(false) // desktop path
    render(
      <SearchableSelect value="" onValueChange={() => {}} options={options} placeholder="Pilih Daerah" />
    )
    fireEvent.click(screen.getByRole("button", { name: /pilih daerah/i }))

    expect(screen.getByPlaceholderText("Cari...")).toBeInTheDocument()
    // Tidak ada tombol ikon "Cari" terpisah di jalur desktop (search selalu aktif).
    expect(screen.queryByRole("button", { name: "Cari" })).not.toBeInTheDocument()
  })
})
