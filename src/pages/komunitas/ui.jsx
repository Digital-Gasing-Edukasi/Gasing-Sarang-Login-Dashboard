// Potongan UI dipakai bareng antar screen Komunitas. Semua statis.

// Header gradient dengan lengkung cekung di bawah (meniru mask radial Komonitas).
// `curve` bikin tepi bawah melengkung putih.
export function CurvedHeader({ from, to, className = "", children }) {
  return (
    <div
      className={
        "relative overflow-hidden bg-gradient-to-r px-5 pt-3 text-white " +
        from +
        " " +
        to +
        " " +
        className
      }
    >
      {children}
      {/* lengkung putih bawah */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-6 rounded-t-[50%] bg-[#F1F2F7]" />
    </div>
  );
}

// Placeholder maskot (aset asli belum ada — lihat memory maskot placeholder).
export function Mascot({ emoji = "🪀", className = "" }) {
  return (
    <div
      className={
        "flex items-center justify-center rounded-full bg-white/20 text-4xl backdrop-blur-sm " +
        className
      }
      aria-hidden
    >
      {emoji}
    </div>
  );
}

// Status bar iOS palsu (jam + sinyal) biar mirip mockup mobile.
export function FakeStatusBar({ dark = false }) {
  return (
    <div
      className={
        "flex items-center justify-between px-6 pt-2 text-sm font-semibold " +
        (dark ? "text-white" : "text-black")
      }
    >
      <span>9:41</span>
      <span className="tracking-tight">📶 📡 🔋</span>
    </div>
  );
}
