import { Calendar, ClipboardList, LogOut, UserSearch, Users, Wallet } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Button } from "./ui/button.jsx";

export const ADMIN_V2_MENUS = [
  { key: "verifikasi-akun", title: "Verifikasi Akun", icon: UserSearch },
  { key: "verifikasi-pembayaran", title: "Verifikasi Pembayaran", icon: Wallet },
  { key: "manajemen-akun", title: "Manajemen Akun", icon: Users },
  { key: "riwayat-pelatihan", title: "Riwayat Pelatihan", icon: Calendar },
  { key: "pendaftaran-trainer", title: "Pendaftaran Trainer", icon: ClipboardList },
];

export function AppSidebar({ active, onSelect, user, onLogout }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-base font-bold text-foreground">Admin V2</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {ADMIN_V2_MENUS.map((menu) => {
          const Icon = menu.icon;
          const isActive = menu.key === active;
          return (
            <Button
              key={menu.key}
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => onSelect?.(menu.key)}
              className={cn(
                "w-full justify-start gap-3 px-3",
                isActive && "font-semibold",
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{menu.title}</span>
            </Button>
          );
        })}
      </nav>

      <div className="border-t p-3">
        {user?.email && (
          <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{user.email}</p>
        )}
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
