// Toast global + delayed-commit (undo-window 5s) + bulk-limit flash.
// Dipindah dari AdminDashboardPage.jsx. Satu state toast untuk semua tab.
//
// Catatan: handleUndoToast SENGAJA tetap di page — undo menyentuh setter lintas
// domain (users, managementUsers, riwayat, role) sehingga paling pas sebagai
// glue komposisi, seperti currentData/filteredUsers. Hook ini menyediakan
// primitifnya: toast, scheduleAction, showUndoToast, flashLimit, apiErrMsg.
import { useState, useRef } from 'react'

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

  // Auto-dismiss toast (aksi tanpa API) setelah 5 detik; reset timer sebelumnya.
  const armToastDismiss = () => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(() => setToast(null), 5000)
    setToastTimeoutId(id)
  }

  const scheduleAction = (apiCall, onError) => {
    executeActionRef.current = true
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(async () => {
      if (executeActionRef.current) {
        try { await apiCall() }
        catch (err) { onError(err) }
      }
      setToast(null)
    }, 5000)
    setToastTimeoutId(id)
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
