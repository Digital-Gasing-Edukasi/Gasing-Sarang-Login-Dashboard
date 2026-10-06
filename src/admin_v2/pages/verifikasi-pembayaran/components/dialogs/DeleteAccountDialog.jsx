import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { requestAccountDeletion } from "../../../../lib/api/index.js";

export function DeleteAccountDialog({ payment, onClose, onDeleted }) {
  const open = !!payment;
  const email = payment?.user?.email;
  const userId = payment?.user?.id;

  const remove = useMutation({
    mutationFn: () => requestAccountDeletion({ userId }),
    onSuccess: () => onDeleted?.(payment),
  });

  // Fresh state every time the dialog closes (stale errors included).
  const handleClose = () => {
    remove.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yakin Hapus Akun Ini?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          Akun {email} akan dihapus. Kamu masih dapat memulihkannya sebelum 30
          hari.
        </p>

        {remove.isError && (
          <p className="text-sm text-red-600">
            Gagal menghapus: {remove.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} disabled={remove.isPending}>
            Batalkan
          </Button>
          <Button
            variant="destructive"
            type="button"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Menghapus…" : "Hapus Akun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
