import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { komunitasTabs, SIDEBAR } from "./data";
import { logoRect, logoSquare, charBlue } from "./assets";

import homeNormal from "@/assets/guest/nav-bar/icon-navbar-home_normal.png";
import homeSelected from "@/assets/guest/nav-bar/icon-navbar-home_selected.png";
import komNormal from "@/assets/guest/nav-bar/icon-navbar-komunitas_normal.png";
import komSelected from "@/assets/guest/nav-bar/icon-navbar-komunitas_selected.png";
import kontenNormal from "@/assets/guest/nav-bar/icon-navbar-konten-eksklusif_normal.png";
import kontenSelected from "@/assets/guest/nav-bar/icon-navbar-konten-eksklusif_selected.png";
import materiNormal from "@/assets/guest/nav-bar/icon-navbar-Materi-Gasing_normal.png";
import materiSelected from "@/assets/guest/nav-bar/icon-navbar-Materi-Gasing_selected.png";
// Catatan: `icon-navbar-normal_selected.png` sebenarnya ikon virtual-meetup state
// normal (salah nama di aset sumber). `..-virtual-meetup_selected.png` = selected.
import virtualNormal from "@/assets/guest/nav-bar/icon-navbar-normal_selected.png";
import virtualSelected from "@/assets/guest/nav-bar/icon-navbar-virtual-meetup_selected.png";

// Urutan tab mengikuti gambar reference: home, komunitas, konten-eksklusif,
// virtual-meet-up, materi-gasing.
const TABS = [
  { key: "home", label: "Home", path: "/komunitas/home", normal: homeNormal, selected: homeSelected },
  { key: "komunitas", label: "Komunitas", path: "/komunitas/komunitas", normal: komNormal, selected: komSelected },
  { key: "konten", label: "Eksklusif", path: "/komunitas/konten-ekslusif", normal: kontenNormal, selected: kontenSelected },
  { key: "virtual", label: "Meet-Up", path: "/komunitas/virtual-meet-up", normal: virtualNormal, selected: virtualSelected },
  { key: "materi", label: "Materi", path: "/komunitas/materi-gasing", normal: materiNormal, selected: materiSelected },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [komunitasTab, setKomunitasTab] = useState(komunitasTabs[0].key);
  // Sidebar desktop bisa dilipat jadi rail ikon.
  const [collapsed, setCollapsed] = useState(false);

  const isKomunitas = pathname.endsWith("/komunitas") || pathname.includes("/komunitas/komunitas");

  return (
    <>
      {/* ===== Bottom Nav (mobile / < lg) ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-[480px] flex-col lg:hidden">
        {/* Sub Navbar (Forum, Challenge, Members) */}
        {isKomunitas && (
          <div className="flex border-t border-slate-200/50 bg-white/60 backdrop-blur-lg">
            {komunitasTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setKomunitasTab(t.key)}
                className={
                  "flex-1 py-3 text-sm font-medium transition-colors " +
                  (komunitasTab === t.key
                    ? "border-b-2 border-[#0033EC] text-[#0033EC]"
                    : "text-slate-600")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Navbar */}
        <nav className="flex items-center justify-around border-t border-slate-200/50 bg-white/60 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.path);
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                className="flex flex-1 flex-col items-center justify-center py-2"
                aria-label={tab.label}
              >
                <img
                  src={active ? tab.selected : tab.normal}
                  alt={tab.label}
                  className="h-11 w-11 object-contain"
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* ===== Sidebar (desktop / lg+) ===== */}
      <aside
        className={
          "sticky top-0 z-50 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex " +
          (collapsed ? "w-20" : "w-64")
        }
      >
        {/* Header logo + tombol collapse */}
        <div
          className={
            "flex items-center py-5 " +
            (collapsed ? "justify-center px-2" : "justify-between px-5")
          }
        >
          {collapsed ? (
            <img
              src={logoSquare}
              alt="Sarang Gasing"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <img
              src={logoRect}
              alt="Sarang Gasing"
              className="h-[38px] w-[83px] object-contain"
            />
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Buka menu" : "Tutup menu"}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            {collapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {SIDEBAR.map((item) => {
            const active = pathname.startsWith(item.path);
            return (
              <div key={item.key}>
                <button
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={
                    "flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-colors " +
                    (collapsed ? "justify-center px-0 " : "px-3 ") +
                    (active
                      ? "bg-[#0033EC]/10 text-[#0033EC]"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.dot && (
                        <span className="h-2 w-2 rounded-full bg-[#0033EC]" />
                      )}
                      {item.children && (
                        <ChevronUp size={16} className="text-slate-400" />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-menu: default terbuka, tapi disabled (guest-only) */}
                {!collapsed && item.children && (
                  <div className="mb-1 ml-9 mt-1 flex flex-col gap-0.5">
                    {item.children.map((c) => (
                      <div
                        key={c.label}
                        aria-disabled="true"
                        className="flex cursor-not-allowed select-none items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 opacity-70"
                      >
                        <span className="flex-1">{c.label}</span>
                        {c.dot && (
                          <span className="h-2 w-2 rounded-full bg-[#0033EC]/40" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer profil */}
        <div
          className={
            "flex items-center gap-3 border-t border-slate-200 py-4 " +
            (collapsed ? "justify-center px-2" : "px-4")
          }
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
            <img
              src={charBlue}
              alt=""
              aria-hidden
              className="h-8 w-8 object-contain"
            />
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-sm font-bold text-slate-700">
                Tamu Gasing
              </span>
              <ChevronDown size={18} className="text-slate-400" />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
