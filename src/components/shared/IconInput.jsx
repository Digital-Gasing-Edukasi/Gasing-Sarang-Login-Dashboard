import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function IconInput({ icon: Icon, iconRight, className, ...props }) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <span className="absolute left-3 text-muted-foreground pointer-events-none z-10">
          <Icon size={16} />
        </span>
      )}
      <Input className={cn(Icon && 'pl-10', iconRight && 'pr-10', className)} {...props} />
      {iconRight}
    </div>
  )
}

export function TogglePassword({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 z-10 text-muted-foreground hover:text-foreground transition-colors">
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}
