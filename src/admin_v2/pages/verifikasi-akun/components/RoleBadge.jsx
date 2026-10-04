import { getRoleMeta } from "../../../lib/roles.js";

// Looked up by discourse group id. `label` is only a fallback for unknown ids.
export function RoleBadge({ groupId, label }) {
  const meta = getRoleMeta(groupId);
  if (!meta) {
    return (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {label || "—"}
      </span>
    );
  }
  const { Icon, color, fullName } = meta;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium"
      style={{ color }}
    >
      <Icon size={16} className="shrink-0" />
      {fullName}
    </span>
  );
}
