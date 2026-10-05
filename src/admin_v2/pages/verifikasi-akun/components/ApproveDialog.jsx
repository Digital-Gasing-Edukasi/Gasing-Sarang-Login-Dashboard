import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.jsx";
import { Label } from "../../../components/ui/label.jsx";
import { getRoleMeta } from "../../../lib/roles.js";
import { RoleSelect } from "./RoleSelect.jsx";
import { TrainingSessionSelect } from "./TrainingSessionSelect.jsx";

export function ApproveDialog({ user, onClose }) {
  const [roleId, setRoleId] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Fresh form every time the dialog opens for (another) user.
  useEffect(() => {
    setRoleId("");
    setSessionId("");
  }, [user?.id]);

  const handleSubmit = () => {
    console.log("Approve akun:", {
      userId: user?.id,
      name: user?.name,
      roleId,
      roleName: getRoleMeta(roleId)?.fullName ?? null,
      trainingSessionId: sessionId,
    });
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
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
          <Label>Pelatihan pertama</Label>
          <TrainingSessionSelect value={sessionId} onValueChange={setSessionId} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!roleId || !sessionId}>
            Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
