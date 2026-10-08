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
import { RoleSelect } from "../../../../components/index.js";
import { updateDiscourseGroup } from "../../../../lib/api/index.js";

// Change-role flow: PATCH /admin/users/:userId/discourse-group.
// The select preselects the user's current role.
export function ChangeRoleDialog({ user, onClose, onSaved }) {
  const [roleId, setRoleId] = useState("");
  const open = !!user;
  const currentRoleId = user?.discourseGroupId != null ? String(user.discourseGroupId) : "";
  const unchanged = !roleId || roleId === currentRoleId;

  // Preselect the current role every time the dialog opens.
  useEffect(() => {
    if (open) setRoleId(currentRoleId);
  }, [open, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: () =>
      updateDiscourseGroup({
        userId: user.id,
        discourseGroupId: Number(roleId),
      }),
    onSuccess: () => onSaved?.(user),
  });

  // Fresh form every time the dialog closes.
  const handleClose = () => {
    setRoleId("");
    save.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Role?</DialogTitle>
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

        {save.isError && (
          <p className="text-sm text-red-600">
            Gagal mengubah role: {save.error?.message || "Unknown error"}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={save.isPending}>
            Batalkan
          </Button>
          <Button onClick={() => save.mutate()} disabled={unchanged || save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
