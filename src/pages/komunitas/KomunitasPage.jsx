import { Routes, Route, Navigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import HomeScreen from "./screens/HomeScreen";
import KontenEksklusifScreen from "./screens/KontenEksklusifScreen";
import VirtualMeetUpScreen from "./screens/VirtualMeetUpScreen";
import MateriGasingScreen from "./screens/MateriGasingScreen";
import KomunitasScreen from "./screens/KomunitasScreen";

// Halaman Komunitas statis untuk guest / fake login (ADR-0004).
// Tiap screen punya route sendiri di bawah /komunitas/*. Mobile-first: konten
// dibatasi max-w-[480px] biar rapi di desktop (frame mobile terpusat).
export default function KomunitasPage() {
  return (
    <div className="min-h-screen bg-[#F1F2F7]">
      <div className="relative mx-auto min-h-screen max-w-[480px] bg-[#F1F2F7] pb-24 shadow-sm">
        <Routes>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomeScreen />} />
          <Route path="konten-ekslusif" element={<KontenEksklusifScreen />} />
          <Route path="virtual-meet-up" element={<VirtualMeetUpScreen />} />
          <Route path="materi-gasing" element={<MateriGasingScreen />} />
          <Route path="komunitas" element={<KomunitasScreen />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </div>
  );
}
