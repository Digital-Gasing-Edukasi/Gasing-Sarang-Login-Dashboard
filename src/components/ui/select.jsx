import * as React from "react"
import { createPortal } from "react-dom"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────────────────────────────────────
// Select responsif:
//  • Desktop (lg+)  → dropdown Radix (popper) seperti biasa.
//  • Mobile (<lg)   → bottom-sheet picker (lihat referensi): item terpilih
//                     jadi pill lavender, list ada fade atas/bawah.
// API komponen identik, jadi halaman tak perlu diubah.
// ────────────────────────────────────────────────────────────────────────────

const MobileCtx = React.createContext(null)

function useIsMobile() {
  const query = "(max-width: 1023px)"
  const [mobile, setMobile] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  )
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return mobile
}

const TRIGGER_CLS = cn(
  "flex h-11 w-full items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-sm",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-primary",
  "hover:border-gray-300",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "transition-all duration-200 cursor-pointer",
  "[&>span]:line-clamp-1"
)

const SelectGroup = SelectPrimitive.Group

function Select({ value, onValueChange, disabled, children, ...props }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [labels, setLabels] = React.useState({})
  const [placeholder, setPlaceholder] = React.useState("")

  const register = React.useCallback((val, label) => {
    setLabels(prev => (prev[val] === label ? prev : { ...prev, [val]: label }))
  }, [])

  // Kunci scroll body saat sheet terbuka.
  React.useEffect(() => {
    if (!isMobile || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [isMobile, open])

  if (!isMobile) {
    return (
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    )
  }

  return (
    <MobileCtx.Provider
      value={{ mobile: true, value, onValueChange, disabled, open, setOpen, labels, register, placeholder, setPlaceholder }}
    >
      {children}
    </MobileCtx.Provider>
  )
}

function SelectValue({ placeholder, ...props }) {
  const ctx = React.useContext(MobileCtx)
  React.useEffect(() => {
    if (ctx?.mobile && placeholder != null) ctx.setPlaceholder(placeholder)
  }, [ctx?.mobile, placeholder]) // eslint-disable-line react-hooks/exhaustive-deps

  if (ctx?.mobile) {
    const hasVal = ctx.value != null && ctx.value !== ""
    const label = hasVal ? ctx.labels[ctx.value] : undefined
    return (
      <span className={cn("line-clamp-1 text-left", !label && "text-muted-foreground")}>
        {label ?? placeholder}
      </span>
    )
  }
  return <SelectPrimitive.Value placeholder={placeholder} {...props} />
}

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(MobileCtx)
  if (ctx?.mobile) {
    return (
      <button
        type="button"
        ref={ref}
        disabled={ctx.disabled}
        onClick={() => !ctx.disabled && ctx.setOpen(true)}
        className={cn(TRIGGER_CLS, className)}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    )
  }
  return (
    <SelectPrimitive.Trigger ref={ref} className={cn(TRIGGER_CLS, className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

// Bottom-sheet mobile.
function MobileSheet({ ctx, title, children }) {
  const { open, setOpen, placeholder } = ctx
  if (!open) {
    // Item tetap mounted (tersembunyi) supaya label ter-register buat trigger.
    return <div className="hidden" aria-hidden="true">{children}</div>
  }
  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in-0"
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[72vh] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom duration-200">
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <h3 className="px-6 pt-3 pb-2 text-[17px] font-bold text-gray-900">
          {title || placeholder}
        </h3>
        <div
          className="flex-1 space-y-1 overflow-y-auto px-4 py-3"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)",
            maskImage:
              "linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

const SelectContent = React.forwardRef(({ className, children, position = "popper", title, ...props }, ref) => {
  const ctx = React.useContext(MobileCtx)
  if (ctx?.mobile) {
    return <MobileSheet ctx={ctx} title={title}>{children}</MobileSheet>
  }
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-input bg-background shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileCtx)
  if (ctx?.mobile) {
    return <div className={cn("px-6 py-2 text-xs font-semibold text-gray-400", className)} {...props} />
  }
  return <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const ctx = React.useContext(MobileCtx)
  const label = typeof children === "string" ? children : React.Children.toArray(children).join("")

  React.useEffect(() => {
    if (ctx?.mobile) ctx.register(value, label)
  }, [ctx?.mobile, value, label]) // eslint-disable-line react-hooks/exhaustive-deps

  if (ctx?.mobile) {
    const selected = ctx.value === value
    return (
      <button
        type="button"
        onClick={() => { ctx.onValueChange?.(value); ctx.setOpen(false) }}
        className={cn(
          "w-full rounded-full py-3.5 text-center text-[15px] transition-colors",
          selected ? "bg-[#EEF0FF] font-bold text-[#1a0b3d]" : "text-gray-600 active:bg-gray-100",
          className
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "transition-colors duration-100",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

export {
  Select, SelectGroup, SelectValue, SelectTrigger,
  SelectContent, SelectLabel, SelectItem,
  SelectScrollUpButton, SelectScrollDownButton,
}
