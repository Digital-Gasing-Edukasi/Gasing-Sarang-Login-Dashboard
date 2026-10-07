import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { Label } from "../../../../components/ui/label.jsx";
import { verifyUser } from "../../../../lib/api/index.js";
import { RegionSelect } from "../RegionSelect.jsx";
import { RoleSelect } from "../RoleSelect.jsx";
import { TrainingSessionSelect } from "../TrainingSessionSelect.jsx";

export function ApproveDialog({ user, onClose, onApproved }) {
  const [roleId, setRoleId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [regionId, setRegionId] = useState("");
  const open = !!user;

  // Alumni region follows the user; admin may still change it.
  useEffect(() => {
    if (open) setRegionId(user?.firstTrainingRegionId ?? "");
  }, [open, user?.id]);

  const approve = useMutation({
    mutationFn: () =>
      verifyUser({
        userId: user.id,
        status: "approved",
        discourseGroupId: Number(roleId),
        firstTrainingSessionId: sessionId,
      }),
    onSuccess: () => {
      setRoleId("");
      setSessionId("");
      onApproved?.(user);
    },
  });
  // Fresh form every time the dialog closes.
  const handleClose = () => {
    setRoleId("");
    setSessionId("");
    setRegionId("");
    approve.reset();
    onClose();
  };

  const handleSubmit = () => approve.mutate();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setujui Akun Ini?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">
          {user?.name}
          {user?.email && (
            <span className="text-muted-foreground"> ({user.email})</span>
          )}
        </p>

        <div className="space-y-2">
          <Label>Role</Label>
          <RoleSelect value={roleId} onValueChange={setRoleId} />
        </div>

        <div className="space-y-2">
          <Label>Alumni Pelatihan</Label>
          <RegionSelect
            value={regionId}
            initialLabel={user?.firstTrainingRegion?.regionName}
            onValueChange={(next) => {
              setRegionId(next);
              setSessionId("");
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Pelatihan pertama</Label>
          <TrainingSessionSelect
            value={sessionId}
            onValueChange={setSessionId}
            regionId={regionId}
          />
        </div>

        {approve.isError && (
          <p className="text-sm text-red-600">
            Gagal menyetujui: {approve.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={approve.isPending}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!roleId || !sessionId || approve.isPending}
          >
            {approve.isPending ? "Menyetujui…" : "Setujui"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
