import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { verifyUser } from "../../../../lib/api/index.js";

// Ditolak -1 only: confirm returning the account to the verification queue.
// PATCH /admin/users/:userId/verify { status: "unreject" }.
export function ReverifyDialog({ user, onClose, onConfirmed }) {
  const open = !!user;

  const reverify = useMutation({
    mutationFn: () => verifyUser({ userId: user.id, status: "unreject" }),
    onSuccess: () => onConfirmed?.(user),
  });

  // Fresh state every time the dialog closes (stale errors included).
  const handleClose = () => {
    reverify.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verifikasi Ulang</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          Akun {user?.email} akan diverifikasi ulang dan akan dikembalikan ke
          Verifikasi Akun.
        </p>

        {reverify.isError && (
          <p className="text-sm text-red-600">
            Gagal memverifikasi ulang: {reverify.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} disabled={reverify.isPending}>
            Batalkan
          </Button>
          <Button
            type="button"
            onClick={() => reverify.mutate()}
            disabled={reverify.isPending}
          >
            {reverify.isPending ? "Memverifikasi…" : "Verifikasi Ulang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
