import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { Input } from "../../../../components/ui/input.jsx";
import { Label } from "../../../../components/ui/label.jsx";
import { rejectManualPayment } from "../../../../lib/api/index.js";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../../components/ui/radio-group.jsx";

const REJECT_REASONS = [
  { key: "unsuficient_transfer", label: "Transfer tidak mencukupi" },
  { key: "fund_not_retrieved", label: "Dana tidak diterima" },
  { key: "payment_receipt_unclear", label: "Bukti pembayaran tidak jelas" },
];

const REASON_INPUTS = {
  unsuficient_transfer: {
    label: "Nominal yang diterima",
    optional: false,
    placeholder: "Contoh: 100000",
  },
  fund_not_retrieved: {
    label: "Catatan",
    optional: true,
    placeholder: "Catatan tambahan untuk alasan ini...",
  },
  payment_receipt_unclear: {
    label: "Catatan",
    optional: true,
    placeholder: "Catatan tambahan untuk alasan ini...",
  },
};

export function PaymentRejectDialog({ payment, onClose, onRejected }) {
  const open = !!payment;
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState({});
  const email = payment?.user?.email;

  const inputDef = REASON_INPUTS[reason];
  const note = notes[reason] ?? "";
  const submittable =
    !!reason && (inputDef?.optional || note.trim().length > 0);

  const reject = useMutation({
    mutationFn: () =>
      rejectManualPayment({
        paymentId: payment.id,
        reason,
        notes: note.trim(),
      }),
    onSuccess: () => {
      setReason("");
      setNotes({});
      onRejected?.(payment);
    },
  });

  // Fresh form every time the dialog closes.
  const handleClose = () => {
    setReason("");
    setNotes({});
    reject.reset();
    onClose();
  };

  const handleSubmit = () => reject.mutate();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak Pembayaran</DialogTitle>
          {email && <DialogDescription>Akun: {email}</DialogDescription>}
        </DialogHeader>

        <p className="text-sm font-medium text-red-600">Pilih alasan penolakan:</p>

        <RadioGroup value={reason} onValueChange={setReason}>
          {REJECT_REASONS.map((r) => (
            <div key={r.key} className="flex items-center gap-2">
              <RadioGroupItem value={r.key} id={`reject-reason-${r.key}`} />
              <Label htmlFor={`reject-reason-${r.key}`}>{r.label}</Label>
            </div>
          ))}
        </RadioGroup>

        {inputDef && (
          <div className="space-y-2">
            <Label htmlFor="reject-reason-note">
              {inputDef.label}
              {inputDef.optional && (
                <span className="text-muted-foreground"> (opsional)</span>
              )}
            </Label>
            <Input
              id="reject-reason-note"
              value={note}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [reason]: e.target.value }))
              }
              placeholder={inputDef.placeholder}
            />
          </div>
        )}

        {reject.isError && (
          <p className="text-sm text-red-600">
            Gagal menolak: {reject.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} disabled={reject.isPending}>
            Batalkan
          </Button>
          <Button
            variant="destructive"
            type="button"
            disabled={!submittable || reject.isPending}
            onClick={handleSubmit}
          >
            {reject.isPending ? "Menolak…" : "Tolak Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
