import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "../../lib/utils.js";

// Searchable select — custom portal dropdown, works inside any Dialog/modal.
// Options: [{ value: string, label: string, disabled?: boolean }]
export function SearchSelect({
  options = [],
  value,
  onValueChange,
  onSearchChange,
  loading = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [rect, setRect] = React.useState(null);
  const triggerRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  const selected = options.find((o) => o.value === value);

  // Open: capture trigger position (viewport-relative for position:fixed).
  const openDropdown = () => {
    if (disabled) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom, left: r.left, width: r.width });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSearch("");
    onSearchChange?.("");
  };

  // Focus search input when dropdown opens.
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    onSearchChange?.(e.target.value);
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    onValueChange?.(option.value);
    close();
  };

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const dropdown = open && rect
    ? (
        <div
          ref={listRef}
          style={{
            position: "fixed",
            width: rect.width,
            zIndex: 9999,
          }}
          className="rounded-md border border-border bg-background shadow-lg overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {/* Options list */}
          <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
            {loading && (
              <li className="py-6 text-center text-sm text-muted-foreground">Mencari…</li>
            )}
            {!loading && options.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
            )}
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onMouseDown={(e) => e.preventDefault()} // keep input focused
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50 text-accent-foreground",
                    option.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={openDropdown}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
          "hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {dropdown}
    </>
  );
}
