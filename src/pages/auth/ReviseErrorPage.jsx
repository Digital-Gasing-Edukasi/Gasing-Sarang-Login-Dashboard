import { SplitLayout } from "@/components/layout/SplitLayout";

// Link revisi tidak valid / kadaluarsa / sudah dipakai (one-time token).
export function ReviseErrorPage({ onNavigate }) {
  return (
    <SplitLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-[380px] animate-fade-in-up">
          <h1 className="text-[22px] font-bold text-foreground">Link Tidak Valid</h1>
          <p className="text-[13px] text-muted-foreground">
            Link revisi tidak valid atau sudah kadaluarsa. Silakan minta admin
            mengirim ulang email revisi.
          </p>
          <button
            onClick={() => onNavigate("login")}
            className="text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </SplitLayout>
  );
}
