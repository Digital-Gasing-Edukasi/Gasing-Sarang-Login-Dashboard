import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button.jsx";
import { Checkbox } from "../../../components/ui/checkbox.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.jsx";
import { Label } from "../../../components/ui/label.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { verifyUser } from "../../../lib/api/index.js";
import {
  FIELD_DEFS,
  LAINNYA_KEY,
  buildVerifyPayload,
  canSubmitReject,
  toggleRejectField,
} from "./rejectPayload.js";

export function RejectDialog({ user, onClose, onRejected }) {
  const [fields, setFields] = useState([]);
  const [reason, setReason] = useState("");
  const open = !!user;
  const showReason = fields.includes(LAINNYA_KEY);

  const reject = useMutation({
    mutationFn: () =>
      verifyUser({
        userId: user.id,
        ...buildVerifyPayload({
          checkedKeys: fields,
          customReason: reason.trim(),
          firstTrainingSessionId: user.firstTrainingSession?.id ?? null,
        }),
      }),
    onSuccess: () => {
      const permanent = fields.includes(LAINNYA_KEY);
      setFields([]);
      setReason("");
      onRejected?.(user, { permanent });
    },
  });

  // Fresh form every time the dialog closes.
  const handleClose = () => {
    setFields([]);
    setReason("");
    reject.reset();
    onClose();
  };

  const handleSubmit = () => reject.mutate();
  const submittable = canSubmitReject({ checkedKeys: fields, customReason: reason });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()} modal={false}>
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

        <div className="space-y-2">
          {FIELD_DEFS.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <Checkbox
                id={`reject-${field.key}`}
                checked={fields.includes(field.key)}
                onCheckedChange={() => setFields((prev) => toggleRejectField(prev, field.key))}
              />
              <Label htmlFor={`reject-${field.key}`}>{field.label}</Label>
            </div>
          ))}
        </div>

        {showReason && (
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Alasan penolakan</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tulis alasan penolakan…"
            />
          </div>
        )}

        {reject.isError && (
          <p className="text-sm text-red-600">
            Gagal menolak: {reject.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={reject.isPending}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!submittable || reject.isPending}
          >
            {reject.isPending ? "Menolak…" : "Tolak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
