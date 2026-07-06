import { useState } from 'react'
import { X } from 'lucide-react'

// Edit peserta = edit user (nama + email) via PATCH /admin/users/:id.
// Parent yang panggil API; modal cuma form + validasi.
export function EditPesertaModal({ peserta, onSave, onCancel }) {
  const [name, setName] = useState(peserta?.name || '')
  const [email, setEmail] = useState(peserta?.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!peserta) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Nama wajib diisi.')
    if (!email.trim()) return setError('Email wajib diisi.')
    setError(''); setSaving(true)
    try {
      await onSave({ name: name.trim(), email: email.trim() })
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1128]">Edit Peserta</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama peserta"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  )
}
