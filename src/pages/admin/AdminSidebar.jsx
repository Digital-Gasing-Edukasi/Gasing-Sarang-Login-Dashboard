import { useState } from 'react'
import { UserSearch, Wallet, Users, Calendar, ClipboardList, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'verifikasi',            label: 'Verifikasi Akun',       icon: UserSearch },
  { id: 'verifikasi-pembayaran', label: 'Verifikasi Pembayaran', icon: Wallet },
  { id: 'manajemen',             label: 'Manajemen Akun',        icon: Users },
  { id: 'riwayat-pelatihan',     label: 'Riwayat Pelatihan',     icon: Calendar },
  { id: 'pendaftaran-trainer',   label: 'Pendaftaran Trainer',   icon: ClipboardList },
]

export function AdminSidebar({ activeTab, onTabChange, onSignOut, user, navFlags = {} }) {
  const [collapsed, setCollapsed] = useState(false)
  const profilePictureUrl = user?.profilePictureUrl || user?.ProfilePictureUrl || ''

  return (
    <aside
      className={cn(
        'flex-none bg-white border-r border-gray-100 text-[#0A1128] flex flex-col h-full transition-all duration-200',
        collapsed ? 'w-[84px] min-w-[84px]' : 'w-[260px] min-w-[260px]'
      )}
    >
      {/* Logo + collapse */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#0A1128] shrink-0" />
          {!collapsed && <span className="font-bold tracking-wide truncate">GC LOGO</span>}
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-gray-400 hover:text-[#0A1128] p-1 shrink-0 transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1.5">
        {NAV.map(item => {
          const Icon = item.icon
          const active = activeTab === item.id
          const showDot = !!navFlags[item.id]
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium',
                collapsed && 'justify-center',
                active ? 'bg-blue-50 text-blue-600' : 'text-[#0A1128] hover:bg-gray-50'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {showDot && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
            </button>
          )
        })}
      </nav>

      <div className="p-5 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden shrink-0">
            <img
              src={profilePictureUrl || 'https://i.pravatar.cc/100'}
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">Admin Gasing</span>
              <span className="text-xs text-gray-400 truncate">@admingasing</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onSignOut} className="text-gray-400 hover:text-[#0A1128] p-2 shrink-0 transition-colors">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  )
}
