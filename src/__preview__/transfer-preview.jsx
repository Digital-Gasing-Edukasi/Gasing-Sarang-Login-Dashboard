// DEV-ONLY harness untuk cek padding TransferBankPage tanpa auth/flow.
// Hapus folder ini + preview.html setelah screenshot. Tidak dipakai produksi.
import React from 'react'
import ReactDOM from 'react-dom/client'
import TransferBankPage from '@/pages/TransferBankPage'
import '@/index.css'

const user = { name: 'Hafiz Kurniawan', profile: { namaLengkap: 'Hafiz Kurniawan' } }
const plan = { name: 'annual', billingCycle: 'annual', priceTotal: 396000 }
const payment = { orderId: 'TX-GAS-2026-9901', amount: 396000 }
const noop = () => {}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#000', color: '#0ff', font: '600 13px monospace', padding: '6px 12px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Section title="STATE 1 — Transfer Pembayaran (checkout)">
      <TransferBankPage user={user} plan={plan} payment={payment} onBack={noop} onSignOut={noop} />
    </Section>
    <Section title="STATE 2 — Pembayaran Berhasil (submitted)">
      <TransferBankPage
        user={user}
        plan={plan}
        payment={payment}
        onBack={noop}
        onSignOut={noop}
        initialSubmitted
        initialReceiptFileId="mock-receipt-id"
      />
    </Section>
  </React.StrictMode>
)
