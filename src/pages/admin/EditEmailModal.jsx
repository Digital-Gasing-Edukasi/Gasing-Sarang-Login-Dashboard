import { useState } from 'react'
import { X } from 'lucide-react'

// Edit email 1 row import → parent yang panggil PATCH (auto re-validate).
export function EditEmailModal({ row, onSave, onCancel }) {
  const [email, setEmail] = useState(row?.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!row) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return setError('Email wajib diisi.')
    if (trimmed === row.email) return onCancel()
    setError('')
    setSaving(true)
    try {
      await onSave(trimmed)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1128]">Edit Email</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="masukkan email"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500 font-medium mt-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}
