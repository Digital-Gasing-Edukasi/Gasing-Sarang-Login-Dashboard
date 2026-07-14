import { ArrowLeft } from "lucide-react";
import { LeftPanel } from "@/components/layout/LeftPanel";

// Layout dasar halaman legal (Ketentuan Layanan / Kebijakan Privasi).
// Dibuka di tab baru dari SignUpPage (target="_blank" href="/register/id/TOS" |
// "/register/id/privacy").
// Tombol "Kembali ke Pendaftaran" mengalihkan SPA di tab itu ke halaman signup.
export function LegalLayout({ title, updatedAt, children, onNavigate }) {
  // Kembali ke Pendaftaran: /register/id/TOS|privacy → /register (router yang
  // menulis ulang URL-nya).
  const handleBack = () => onNavigate("signup");

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />
      <div className="flex-1 flex flex-col min-h-screen bg-background overflow-y-auto">
        <div className="flex-1 w-full max-w-2xl mx-auto px-6 lg:px-16 pt-10 lg:pt-16 pb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Kembali ke Pendaftaran
          </button>

          <h1 className="text-[26px] lg:text-[30px] font-bold text-foreground mb-1.5">
            {title}
          </h1>
          <p className="text-[13px] text-muted-foreground mb-8">
            Terakhir diperbarui: {updatedAt}
          </p>

          <div className="space-y-6 text-[14px] leading-relaxed text-foreground/90">
            {children}
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
            >
              <ArrowLeft size={16} /> Kembali ke Pendaftaran
            </button> 
          </div>
        </div>
        <div className="pb-6">
          <p className="text-xs text-muted-foreground text-center">
            ©2026 Gasing Academy. All rights reserved..
          </p>
        </div>
      </div>
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-[16px] font-bold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
