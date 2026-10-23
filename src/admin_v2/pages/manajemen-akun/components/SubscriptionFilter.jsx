import { SlidersHorizontal } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Checkbox } from "../../../components/ui/checkbox.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover.jsx";

// Approved accounts can hold any of these — the backend accepts a comma list.
export const SUBSCRIPTION_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "expired", label: "Expired" },
  { value: "not_subscribed", label: "Belum Langganan" },
];

export const ALL_SUBSCRIPTIONS = SUBSCRIPTION_OPTIONS.map((o) => o.value);

// Multi-select checkbox filter for the Disetujui tab. An empty selection is
// treated as "no filter" (all statuses).
export function SubscriptionFilter({ value, onChange }) {
  const isFiltered = value.length > 0 && value.length < ALL_SUBSCRIPTIONS.length;

  const toggle = (optionValue, checked) => {
    const next = checked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue);
    onChange(SUBSCRIPTION_OPTIONS.filter((o) => next.includes(o.value)).map((o) => o.value));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          aria-label="Filter langganan"
          className="gap-2"
        >
          <SlidersHorizontal size={16} />
          <span>Langganan</span>
          {isFiltered && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {value.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        {SUBSCRIPTION_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Checkbox
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked === true)}
              aria-label={option.label}
            />
            <span>{option.label}</span>
          </label>
        ))}
        <button
          type="button"
          onClick={() => onChange(ALL_SUBSCRIPTIONS)}
          className="mt-1 w-full rounded-sm border-t px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Tampilkan semua
        </button>
      </PopoverContent>
    </Popover>
  );
}
