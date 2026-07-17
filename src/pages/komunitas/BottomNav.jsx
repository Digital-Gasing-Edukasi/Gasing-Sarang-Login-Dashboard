import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { komunitasTabs } from "./data";

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
      <aside className="sticky top-0 z-50 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="text-lg font-extrabold text-[#0033EC]">Sarang Gasing</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.path);
            return (
              <div key={tab.key}>
                <button
                  onClick={() => navigate(tab.path)}
                  className={
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
                    (active
                      ? "bg-[#0033EC]/10 text-[#0033EC]"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  <img
                    src={active ? tab.selected : tab.normal}
                    alt=""
                    aria-hidden
                    className="h-7 w-7 object-contain"
                  />
                  {tab.label}
                </button>

                {/* Sub-menu Komunitas (Forum, Challenge, Members) */}
                {tab.key === "komunitas" && isKomunitas && (
                  <div className="mb-1 ml-8 mt-1 flex flex-col gap-0.5 border-l border-slate-200 pl-3">
                    {komunitasTabs.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setKomunitasTab(t.key)}
                        className={
                          "rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors " +
                          (komunitasTab === t.key
                            ? "text-[#0033EC]"
                            : "text-slate-500 hover:text-slate-800")
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
