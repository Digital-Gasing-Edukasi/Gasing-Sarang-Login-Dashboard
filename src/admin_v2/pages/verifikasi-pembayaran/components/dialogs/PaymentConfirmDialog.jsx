import { Download } from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { FALLBACK_TEXT, formatRupiah } from "../../../../lib/format.js";

const PACKAGE_NAMES = { Yearly: "Tahunan", Monthly: "Bulanan" };

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{children}</p>
    </div>
  );
}

export function PaymentConfirmDialog({ payment, onClose, onReject }) {
  const open = !!payment;
  const email = payment?.user?.email;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[768px]">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          {email && <DialogDescription>Akun: {email}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <Field label="Nama Pengirim">{payment?.senderName || FALLBACK_TEXT}</Field>
            <Field label="Bank Pengirim">{payment?.senderBankName || FALLBACK_TEXT}</Field>
            <Field label="Tanggal Transfer">
              {payment?.transferDate?.formatted || FALLBACK_TEXT}
            </Field>
            <Field label="Jenis Paket">
              {PACKAGE_NAMES[payment?.package?.name] ?? payment?.package?.name ?? FALLBACK_TEXT}
            </Field>
            <Field label="Harga">{formatRupiah(payment?.package?.price)}</Field>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Bukti Transfer</p>
            {payment?.receiptUrl ? (
              <>
                <img
                  src={payment.receiptUrl}
                  alt="Bukti transfer"
                  className="max-h-80 w-full rounded-md border object-contain"
                />
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-500 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                >
                  <Download size={14} />
                  Unduh Bukti
                </a>
              </>
            ) : (
              <p className="text-sm text-foreground">{FALLBACK_TEXT}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="destructive" type="button" onClick={() => onReject?.(payment)}>
            Tolak Pembayaran
          </Button>
          <Button type="button" onClick={() => {}}>
            Konfirmasi Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
