import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { copyText } from "../../../../lib/clipboard.js";
import { toast } from "../../../../components/ui/use-toast.js";
import { verifyUser } from "../../../../lib/api/index.js";

export function VoucherConfirmDialog({ user, onClose, onConfirmed }) {
  const [copied, setCopied] = useState(false);
  const open = !!user;
  const code = user?.lastVoucher?.code ?? "";

  const confirm = useMutation({
    mutationFn: () => verifyUser({ userId: user.id, status: "approved" }),
    onSuccess: () => {
      setCopied(false);
      onConfirmed?.(user);
    },
  });

  // Fresh state every time the dialog closes.
  const handleClose = () => {
    setCopied(false);
    confirm.reset();
    onClose();
  };

  const handleCopy = async () => {
    if (!code) return;
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      toast({ title: "Kode disalin", description: code });
    } else {
      toast({ title: "Gagal menyalin", description: "Salin manual kode di atas." });
    }
  };

  const handleSubmit = () => confirm.mutate();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Voucher?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          {user?.name}
          {user?.email && (
            <span className="text-muted-foreground"> ({user.email})</span>
          )}
        </p>

        <p className="text-lg font-bold text-blue-500">{code || "—"}</p>

        <div>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={handleCopy}
            disabled={!code}
          >
            <Copy size={16} />
            <span>Salin</span>
          </Button>
        </div>

        {confirm.isError && (
          <p className="text-sm text-red-600">
            Gagal mengonfirmasi: {confirm.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={confirm.isPending}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!copied || confirm.isPending}
          >
            {confirm.isPending ? "Mengonfirmasi…" : "Konfirmasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
