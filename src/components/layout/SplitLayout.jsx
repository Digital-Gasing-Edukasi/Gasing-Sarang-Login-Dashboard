import { LeftPanel } from "@/components/layout/LeftPanel";

// Shell dua kolom untuk halaman auth (login/signup/otp/...): panel kiri + konten.
export function SplitLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <LeftPanel />
      {children}
    </div>
  );
}
