import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { deleteUserPermanently } from "../../../../lib/api/index.js";

// Permanent delete flow for the Baru Dihapus tab: DELETE /admin/users/:id.
// Irreversible — hence its own copy and destructive confirm.
export function PermanentDeleteDialog({ user, onClose, onDeleted }) {
  const open = !!user;

  const remove = useMutation({
    mutationFn: () => deleteUserPermanently({ userId: user.id }),
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
          <DialogTitle>Hapus Akun Permanen?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          Akun {user?.email} akan dihapus permanen. Tindakan ini tidak dapat
          dibatalkan.
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
            {remove.isPending ? "Menghapus…" : "Hapus Permanen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
