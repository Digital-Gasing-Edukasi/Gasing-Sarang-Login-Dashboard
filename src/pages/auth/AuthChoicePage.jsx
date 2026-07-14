import { RightPanel } from '@/components/layout/RightPanel'
import { Button } from '@/components/ui/button'
import { tokenStorage, discourseApi, authApi, webAppApi } from '@/lib/api'
import { ArrowRight, LogIn, LogOut } from 'lucide-react'

export function AuthChoicePage({ onNavigate, onSignOut }) {
  const handleRedirectDefault = () => {
    webAppApi.redirectWithTokens()
  }

  const handleRedirectSso = async () => {
    try {
      await discourseApi.ssoLogin()
    } catch (error) {
      console.error('Gagal inisiasi SSO:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Gagal logout:', error)
    }
    if (onSignOut) {
      onSignOut()
    } else {
      tokenStorage.clear()
      onNavigate('login')
    }
  }

  return (
    <RightPanel>
      <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto animate-fade-in-up">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
          <LogIn className="w-6 h-6 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-3 text-center">
          Pilih Tujuan Login
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Anda telah berhasil masuk. Silakan pilih aplikasi atau layanan yang ingin Anda tuju selanjutnya.
        </p>

        <div className="space-y-4 w-full">
          <Button 
            onClick={handleRedirectDefault} 
            className="w-full flex items-center justify-between"
            size="lg"
          >
            <span>Gasing Web App</span>
            <ArrowRight size={18} />
          </Button>

          <Button 
            onClick={handleRedirectSso} 
            variant="outline" 
            className="w-full flex items-center justify-between"
            size="lg"
          >
            <span>Komunitas (SSO)</span>
            <ArrowRight size={18} />
          </Button>

          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 mt-4"
            size="lg"
          >
            <LogOut size={18} className="mr-2" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </RightPanel>
  )
}
