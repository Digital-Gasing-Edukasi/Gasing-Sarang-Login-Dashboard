import { useEffect, useState } from "react";
import { cn } from "../../../lib/utils.js";
import { FALLBACK_TEXT, formatCountdown, formatDateTime } from "../../../lib/format.js";

// 24h payment deadline from createdAt (unix seconds). While in the future it
// ticks down client-side (no refetch); at zero it flips to the red date.
export function DeadlineCell({ createdAtUnix }) {
  const deadlineMs =
    typeof createdAtUnix === "number" ? (createdAtUnix + 24 * 3600) * 1000 : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(deadlineMs) || deadlineMs <= Date.now()) return;
    const timer = setInterval(() => {
      if (Date.now() >= deadlineMs) clearInterval(timer);
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlineMs]);

  if (Number.isNaN(deadlineMs)) {
    return <span className="whitespace-nowrap text-sm text-foreground">{FALLBACK_TEXT}</span>;
  }
  if (deadlineMs - now <= 0) {
    return (
      <span className="whitespace-nowrap text-sm font-semibold text-red-600">
        {formatDateTime(new Date(deadlineMs))}
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap text-sm tabular-nums text-red-600 font-semibold tracking-wide">
      {formatCountdown(deadlineMs - now)}
    </span>
  );
}
