import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils.js";
import { FALLBACK_TEXT } from "../lib/format.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip.jsx";

// Free-text cell: renders like a plain span, but if the content overflows
// (single-line nowrap OR 2-line clamp), hovering shows the full value.
export function OverflowText({ value, className, delayDuration = 0 }) {
  const ref = useRef(null);
  const [overflowing, setOverflowing] = useState(false);
  const text = value || FALLBACK_TEXT;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      setOverflowing(
        el.scrollWidth > el.clientWidth + 1 ||
          el.scrollHeight > el.clientHeight + 1,
      );
    };
    check();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span ref={ref} className={cn("block", className)}>
            {text}
          </span>
        </TooltipTrigger>
        {overflowing && <TooltipContent>{text}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
