import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function IconInput({ icon: Icon, iconRight, className, ...props }) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <span className="absolute left-5 text-[#81858F] pointer-events-none z-10">
          <Icon size={16} strokeWidth={2.25}/>
        </span>
      )}
      <Input className={cn(Icon && 'pl-[43px]', iconRight && 'pr-[43px]', className)} {...props} />
      {iconRight}
    </div>
  )
}

export function TogglePassword({ show, onToggle }) {
  return (
    // onMouseDown preventDefault: klik ikon mata tidak mencuri fokus dari input,
    // supaya checklist password yang bergantung fokus tidak kedip hilang.
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onToggle}
      className="absolute right-5 z-10 text-muted-foreground hover:text-foreground transition-colors">
      {show ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  )
}
