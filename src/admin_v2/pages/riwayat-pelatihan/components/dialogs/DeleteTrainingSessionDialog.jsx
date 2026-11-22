import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { Input } from "../../../../components/ui/input.jsx";

export function DeleteTrainingSessionDialog({
  session,
  open,
  onClose,
  onConfirm,
  isPending = false,
}) {
  const [typedText, setTypedText] = useState("");
  const isOpen = open ?? !!session;

  const handleClose = () => {
    if (isPending) return;
    setTypedText("");
    onClose?.();
  };

  const handleConfirm = () => {
    if (typedText !== "DELETE") return;
    onConfirm?.(session);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>

        <DialogHeader className="space-y-1 text-center">
          <DialogTitle className="text-center text-lg font-bold text-foreground">
            Yakin Hapus Riwayat Pelatihan?
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Kamu akan menghapus {session?.name}. Seluruh data yang tersimpan akan
            hilang.
          </p>
        </DialogHeader>

        <div className="space-y-1.5 text-left">
          <label className="text-xs text-muted-foreground">
            Ketik <strong className="font-bold text-red-600">DELETE</strong> untuk
            melanjutkan
          </label>
          <Input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="DELETE"
            disabled={isPending}
            className="w-full"
          />
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isPending}
          >
            Batalkan
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={typedText !== "DELETE" || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Menghapus…" : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
