import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { cancelAccountDeletion } from "../../../../lib/api/index.js";

// Baru Dihapus only: confirm cancelling the pending deletion request.
// DELETE /admin/users/:userId/deletion-request (no payload).
// NOTE: same path as the soft delete but a different method — and different
// from DELETE .../:userId/suspend (unsuspend). Do not merge these flows.
export function CancelDeletionDialog({ user, onClose, onConfirmed }) {
  const open = !!user;

  const restore = useMutation({
    mutationFn: () => cancelAccountDeletion({ userId: user.id }),
    onSuccess: () => onConfirmed?.(user),
  });

  // Fresh state every time the dialog closes (stale errors included).
  const handleClose = () => {
    restore.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pulihkan Akun</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          Akun {user?.email} akan dipulihkan dan diaktifkan kembali.
        </p>

        {restore.isError && (
          <p className="text-sm text-red-600">
            Gagal memulihkan: {restore.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} disabled={restore.isPending}>
            Batalkan
          </Button>
          <Button
            type="button"
            onClick={() => restore.mutate()}
            disabled={restore.isPending}
          >
            {restore.isPending ? "Memulihkan…" : "Pulihkan Akun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
