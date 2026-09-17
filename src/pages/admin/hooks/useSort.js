// Sorting tabel admin (dipakai semua tab). Dipindah verbatim dari AdminDashboardPage.jsx.
import { useState } from 'react'

export function useSort() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  return { sortConfig, handleSort, resetSort: () => setSortConfig({ key: null, direction: 'asc' }) }
}

export function applySortToList(list, sortConfig) {
  if (!sortConfig.key) return list
  return [...list].sort((a, b) => {
    let valA = a[sortConfig.key] || ''
    let valB = b[sortConfig.key] || ''
    if (sortConfig.key === 'lastUpdated') {
      valA = a.lastUpdatedMs || 0
      valB = b.lastUpdatedMs || 0
    } else if (sortConfig.key === 'submittedDate') {
      valA = a.submittedMs || 0
      valB = b.submittedMs || 0
    } else if (sortConfig.key === 'trainingPeriod') {
      valA = a.trainingPeriodMs || 0
      valB = b.trainingPeriodMs || 0
    } else if (sortConfig.key === 'birthdate' || sortConfig.key === 'endDate') {
      valA = valA ? new Date(valA).getTime() : 0
      valB = valB ? new Date(valB).getTime() : 0
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase(); valB = valB.toLowerCase()
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })
}
