import { useLocation, useNavigate } from "react-router-dom";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-[480px] items-center justify-around border-t border-gray-200 bg-white px-1 pb-[env(safe-area-inset-bottom)]">
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
  );
}
