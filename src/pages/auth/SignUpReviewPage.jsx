import { CheckCircle2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RightPanel } from '@/components/layout/RightPanel'
import { StepIndicator } from '@/components/layout/StepIndicator'

export function SignUpReviewPage({ onNavigate }) {
  return (
    <RightPanel>
      <StepIndicator currentStep={3} />
      <div className="animate-fade-in-up delay-100 text-center">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-6">Terima Kasih Telah Mendaftar</h1>
      </div>
      <div className="animate-fade-in-up delay-200 space-y-4 text-center mb-8">
        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">Akun Anda sedang kami review maks. 1×24 jam</p>
          <p className="text-sm text-muted-foreground">untuk memastikan Anda sudah terdaftar secara official sebagai Trainer Guru di GASING Academy.</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-sm text-foreground/80">
            <span className="font-semibold">Mohon cek email secara berkala</span>{' '}
            untuk informasi status pengajuan akunmu.
          </p>
        </div>
      </div>
      <div className="animate-fade-in-up delay-300">
        <Button className="w-full" onClick={() => onNavigate('login')}>
          <LogIn size={16} /> Back To Login
        </Button>
      </div>
    </RightPanel>
  )
}
