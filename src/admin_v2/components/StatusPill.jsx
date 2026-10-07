import { cn } from "../lib/utils.js";
import { getVerifiedStatusMeta } from "../lib/verificationStatus.js";

export function StatusPill({ value, className }) {
  const meta = getVerifiedStatusMeta(value);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
