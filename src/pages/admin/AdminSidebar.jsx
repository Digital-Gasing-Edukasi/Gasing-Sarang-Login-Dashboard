import { User, Users, LogOut, CalendarPlus, History } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSidebar({ activeTab, onTabChange, onSignOut }) {
  return (
    <aside className="w-[260px] min-w-[260px] max-w-[260px] flex-none bg-[#0A1128] text-white flex flex-col h-full">
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white shrink-0" />
        <span className="text-xl font-bold tracking-wide">Logo</span>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-2">
        <button
          onClick={() => onTabChange("verifikasi")}
          className={cn(
            "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
            activeTab === "verifikasi"
              ? "bg-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5",
          )}
        >
          <User size={18} /> Verifikasi Akun
        </button>
        <button
          onClick={() => onTabChange("manajemen")}
          className={cn(
            "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
            activeTab === "manajemen"
              ? "bg-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5",
          )}
        >
          <Users size={18} /> Manajemen Akun
        </button>
        <button
          onClick={() => onTabChange("riwayat-pelatihan")}
          className={cn(
            "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
            activeTab === "riwayat-pelatihan"
              ? "bg-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5",
          )}
        >
          <History size={18} /> Riwayat Pelatihan
        </button>
        <button
          onClick={() => onTabChange("pendaftaran-trainer")}
          className={cn(
            "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
            activeTab === "pendaftaran-trainer"
              ? "bg-white/10"
              : "text-gray-400 hover:text-white hover:bg-white/5",
          )}
        >
          <CalendarPlus size={18} /> Pendaftaran Trainer
        </button>
      </nav>

      <div className="p-6 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden">
            <img
              src="https://i.pravatar.cc/100"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin Gasing</span>
            <span className="text-xs text-gray-400">@admingasing</span>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="text-white hover:text-gray-300 p-2"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
