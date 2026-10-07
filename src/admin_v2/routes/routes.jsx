import { lazy } from "react";
import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  UserSearch,
  Users,
  Wallet,
} from "lucide-react";

const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage.jsx"));
const VerifikasiAkunPage = lazy(() =>
  import("../pages/verifikasi-akun/VerifikasiAkunPage.jsx"),
);
const VerifikasiPembayaranPage = lazy(() =>
  import("../pages/verifikasi-pembayaran/VerifikasiPembayaranPage.jsx"),
);
const ManajemenAkunPage = lazy(() =>
  import("../pages/manajemen-akun/ManajemenAkunPage.jsx"),
);
const RiwayatPelatihanPage = lazy(() =>
  import("../pages/riwayat-pelatihan/RiwayatPelatihanPage.jsx"),
);
const PendaftaranTrainerPage = lazy(() =>
  import("../pages/pendaftaran-trainer/PendaftaranTrainerPage.jsx"),
);

// Single source of truth for v2 navigation: sidebar + router both read this.
// `path` is relative to ADMIN_V2_BASE_PATH ("" = index/Dashboard).
export const ADMIN_V2_BASE_PATH = "/dashboard-v2";

export const ADMIN_V2_ROUTES = [
  {
    key: "dashboard",
    title: "Dashboard",
    path: "",
    icon: LayoutDashboard,
    element: <DashboardPage />,
  },
  {
    key: "verifikasi-akun",
    title: "Verifikasi Akun",
    path: "verifikasi-akun",
    icon: UserSearch,
    element: <VerifikasiAkunPage />,
  },
  {
    key: "verifikasi-pembayaran",
    title: "Verifikasi Pembayaran",
    path: "verifikasi-pembayaran",
    icon: Wallet,
    element: <VerifikasiPembayaranPage />,
  },
  {
    key: "manajemen-akun",
    title: "Manajemen Akun",
    path: "manajemen-akun",
    icon: Users,
    element: <ManajemenAkunPage />,
  },
  {
    key: "riwayat-pelatihan",
    title: "Riwayat Pelatihan",
    path: "riwayat-pelatihan",
    icon: Calendar,
    element: <RiwayatPelatihanPage />,
  },
  {
    key: "pendaftaran-trainer",
    title: "Pendaftaran Trainer",
    path: "pendaftaran-trainer",
    icon: ClipboardList,
    element: <PendaftaranTrainerPage />,
  },
];

export function adminV2Path(route) {
  return route.path ? `${ADMIN_V2_BASE_PATH}/${route.path}` : ADMIN_V2_BASE_PATH;
}

// Active section highlight: exact match for Dashboard (so child pages don't
// all light it up), prefix match for the rest (covers future sub-routes).
export function isRouteActive(route, pathname) {
  const full = adminV2Path(route);
  if (!route.path) return pathname === full;
  return pathname === full || pathname.startsWith(`${full}/`);
}

export function findRouteByPath(pathname) {
  return (
    ADMIN_V2_ROUTES.find((route) => isRouteActive(route, pathname)) ??
    ADMIN_V2_ROUTES[0]
  );
}
