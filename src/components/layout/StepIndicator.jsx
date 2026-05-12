import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1, label: 'Buat Akun' },
  { n: 2, label: 'Verifikasi Data' },
  { n: 3, label: 'Review' },
]

export function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-start gap-0 mb-8 animate-fade-in-up">
      {STEPS.map((s, i) => {
        const done   = currentStep > s.n
        const active = currentStep === s.n
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {done ? <CheckCircle2 size={16} /> : s.n}
              </div>
              <span className={cn(
                'text-xs mt-1.5 font-medium whitespace-nowrap',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mt-4 mx-1 transition-all duration-500',
                currentStep > s.n ? 'bg-primary' : 'bg-muted'
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
