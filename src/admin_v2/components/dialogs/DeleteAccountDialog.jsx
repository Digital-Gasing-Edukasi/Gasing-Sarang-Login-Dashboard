import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.jsx";
import { requestAccountDeletion } from "../../lib/api/index.js";

// Shared delete-account flow: POST /admin/users/:id/deletion-request
// (soft delete, recoverable for 30 days). `user` is the account itself
// ({ id, email }) — callers with nested users pass `row.user`.
export function DeleteAccountDialog({ user, onClose, onDeleted }) {
  const open = !!user;
  const userId = user?.id;

  const remove = useMutation({
    mutationFn: () => requestAccountDeletion({ userId }),
    onSuccess: () => onDeleted?.(user),
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
          Akun {user?.email} akan dihapus. Kamu masih dapat memulihkannya sebelum 30
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
