import { Button } from "../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.jsx";

// Stub: reject form (reason, re-register vs permanent) comes next.
export function RejectDialog({ user, onClose }) {
  const handleReject = () => {
    console.log("Reject akun:", { userId: user?.id, name: user?.name });
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak Akun Ini?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          {user?.name}
          {user?.email && (
            <span className="text-muted-foreground"> ({user.email})</span>
          )}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            Tolak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
