// Toast global + delayed-commit (dismiss 5s, commit 1s setelahnya) + bulk-limit flash.
// Dipindah dari AdminDashboardPage.jsx. Satu state toast untuk semua tab.
//
// Catatan: handleUndoToast SENGAJA tetap di page — undo menyentuh setter lintas
// domain (users, managementUsers, riwayat, role) sehingga paling pas sebagai
// glue komposisi, seperti currentData/filteredUsers. Hook ini menyediakan
// primitifnya: toast, scheduleAction, showUndoToast, flashLimit, apiErrMsg.
import { useState, useRef } from 'react'

// Jendela undo (toast tampil) + jeda commit setelah toast ditutup.
const UNDO_WINDOW_MS = 5000
const COMMIT_DELAY_AFTER_DISMISS = 1000

export function useAdminToast() {
  const [toast, setToast]                   = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)
  const [limitHit, setLimitHit] = useState(false)
  const limitTimeoutRef = useRef(null)
  const executeActionRef = useRef(true)

  const flashLimit = () => {
    setLimitHit(true)
    if (limitTimeoutRef.current) clearTimeout(limitTimeoutRef.current)
    limitTimeoutRef.current = setTimeout(() => setLimitHit(false), 2500)
  }

  // Auto-dismiss toast (aksi tanpa API) setelah jendela undo; reset timer sebelumnya.
  const armToastDismiss = () => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(() => setToast(null), UNDO_WINDOW_MS)
    setToastTimeoutId(id)
  }

  // Commit aksi admin ke API.
  //   delayed=false (default): tanpa tombol Batalkan + eksekusi LANGSUNG.
  //     Toast yang sudah dipasang caller dilucuti jadi info murni supaya
  //     AdminToast tidak render tombol Batalkan.
  //   delayed=true: implementasi lama — toast undo 5 detik, commit API
  //     1 detik setelah dismiss (lihat catatan race di bawah).
  const scheduleAction = (apiCall, onError, delayed = false) => {
    executeActionRef.current = true
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    if (!delayed) {
      setToast((prev) =>
        prev && typeof prev === 'object' ? { message: prev.message } : prev
      )
      armToastDismiss()
      ;(async () => {
        try { await apiCall() }
        catch (err) { onError(err) }
      })()
      return
    }
    // T+5s: tutup toast dulu. Commit API jalan 1 detik SETELAH dismiss —
    // jeda ini menutup race "Batalkan ditekan bersamaan action fire": dulu
    // dismiss+fire terjadi dalam satu tick, sehingga klik undo yang masuk
    // tepat di batas waktu tiba setelah request sudah in-flight (data sudah
    // terkirim tapi UI di-rollback → error). Sekarang jendela undo tertutup
    // rapi 1 detik sebelum commit berjalan.
    const dismissId = setTimeout(() => {
      setToast(null)
      const commitId = setTimeout(async () => {
        if (executeActionRef.current) {
          try { await apiCall() }
          catch (err) { onError(err) }
        }
      }, COMMIT_DELAY_AFTER_DISMISS)
      setToastTimeoutId(commitId)
    }, UNDO_WINDOW_MS)
    setToastTimeoutId(dismissId)
  }

  // Tempel pesan error asli dari API (kalau ada) ke belakang copy generik, biar
  // banner error informatif bukan cuma "Gagal ..." tanpa alasan (DB-002 #11).
  const apiErrMsg = (err, fallback) => err?.message ? `${fallback} (${err.message})` : fallback

  // Toast dengan undo untuk aksi FE-only (tanpa API): perubahan state langsung,
  // `undo` mengembalikan state, auto-dismiss 5 detik.
  const showUndoToast = (message, undo) => {
    setToast({ message, undo })
    armToastDismiss()
  }

  const dismissToast = () => {
    setToast(null)
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
  }

  return {
    toast, setToast,
    toastTimeoutId,
    limitHit, setLimitHit, flashLimit,
    executeActionRef,
    armToastDismiss,
    scheduleAction,
    apiErrMsg,
    showUndoToast,
    dismissToast,
  }
}
