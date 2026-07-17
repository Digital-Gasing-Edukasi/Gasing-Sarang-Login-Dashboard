import { Routes, Route, Navigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import HomeScreen from "./screens/HomeScreen";
import KontenEksklusifScreen from "./screens/KontenEksklusifScreen";
import VirtualMeetUpScreen from "./screens/VirtualMeetUpScreen";
import MateriGasingScreen from "./screens/MateriGasingScreen";
import KomunitasScreen from "./screens/KomunitasScreen";
import GANewsScreen from "./screens/GANewsScreen";

// Halaman Komunitas statis untuk guest / fake login (ADR-0004).
// Tiap screen punya route sendiri di bawah /komunitas/*.
// Responsif: mobile = frame max-w-[480px] + BottomNav; desktop (lg:) = Sidebar
// kiri + konten full-width (header hero bisa full-bleed via -mx pada screen).
export default function KomunitasPage() {
  return (
    <div className="min-h-screen bg-[#F1F2F7] lg:flex flex-col relative">
      <div className="flex flex-1">
      <BottomNav />
      <main className="relative mx-auto w-full min-h-screen max-w-[480px] bg-[#F1F2F7] pb-24 shadow-sm lg:mx-0 lg:min-w-0 lg:max-w-none lg:flex-1 lg:pb-0 lg:shadow-none flex flex-col">
        <div className="lg:px-6 lg:py-6 flex-1">
          <Routes>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomeScreen />} />
            <Route path="ga-news" element={<GANewsScreen />} />
            <Route path="konten-ekslusif" element={<KontenEksklusifScreen />} />
            <Route path="virtual-meet-up" element={<VirtualMeetUpScreen />} />
            <Route path="materi-gasing" element={<MateriGasingScreen />} />
            <Route path="komunitas" element={<KomunitasScreen />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </main>
      </div>
    </div>
  );
}
