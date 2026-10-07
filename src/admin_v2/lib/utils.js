import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Local copy scoped to admin_v2 so the v1 `cn` helper stays untouched.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
