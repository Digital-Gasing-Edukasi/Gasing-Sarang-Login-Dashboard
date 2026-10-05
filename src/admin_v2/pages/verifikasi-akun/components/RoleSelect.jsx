import { ROLE_META_BY_ID } from "../../../lib/roles.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../components/ui/select.jsx";

const ROLE_OPTIONS = Object.entries(ROLE_META_BY_ID).map(([id, meta]) => ({
  value: String(id),
  ...meta,
}));

// Role dropdown with icon + color, matching the RoleBadge look.
export function RoleSelect({ value, onValueChange, placeholder = "Pilih role…" }) {
  const selected = ROLE_OPTIONS.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Role">
        {selected ? (
          <div
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: selected.color }}
          >
            <selected.Icon size={16} className="shrink-0" />
            <div>{selected.fullName}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: option.color }}
            >
              <option.Icon size={16} className="shrink-0" />
              {option.fullName}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
