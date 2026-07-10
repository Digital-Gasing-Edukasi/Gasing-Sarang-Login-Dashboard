import { useState, useEffect } from "react";
import { Calendar, Loader2, LogIn, UserSearch, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileReviewNotice } from "@/components/shared/MobileReviewNotice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RightPanel } from "@/components/layout/RightPanel";
import { IconInput } from "@/components/shared/IconInput";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { cn } from "@/lib/utils";
import { authApi, regionsApi, trainingSessionsApi } from "@/lib/api";

const asList = (data) =>
  Array.isArray(data) ? data : data?.data || data?.items || [];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const sessionDate = (s) => {
  const sd = s.startDate;
  const raw = sd?.utc?.raw ?? (typeof sd === "string" ? sd : null);
  const d = sd?.unix ? new Date(sd.unix * 1000) : raw ? new Date(raw) : null;
  return d && !isNaN(d) ? d : null;
};
const sessionYear = (s) => {
  const d = sessionDate(s);
  return d ? String(d.getFullYear()) : "";
};
const sessionMonth = (s) => {
  const d = sessionDate(s);
  return d ? String(d.getMonth()) : "";
};

// Style border merah saat field invalid (dipakai Input & SelectTrigger).
const errCls = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 focus:border-red-500 focus:ring-red-500/30";

// Field yang BISA diperbaiki user di halaman ini (lihat desain — Nama/Username/Email
// tidak ditampilkan, hanya dikirim ulang apa adanya dari payload). Penanda error
// hanya untuk key di sini agar submit tidak tersangkut field yang tak punya input.
const CORRECTABLE_KEYS = ["tanggalLahir", "lokasi", "riwayatPelatihan", "namaSekolah"];

// Pesan error merah di bawah field yang salah (border merah + teks).
function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[13px] text-red-500 animate-fade-in">{message}</p>;
}

export function FixDataPage({ fixData, reviseToken, onNavigate }) {
  // Map invalid[] + notes{} → { [fieldKey]: pesan }. Sumber penanda error dinamis.
  // Hanya field yang bisa diperbaiki di halaman ini (CORRECTABLE_KEYS).
  const initialErrors = () => {
    const errs = {};
    (fixData?.invalid || [])
      .filter((k) => CORRECTABLE_KEYS.includes(k))
      .forEach((k) => {
        errs[k] = fixData?.notes?.[k] || "Data kurang sesuai.";
      });
    return errs;
  };

  const [fieldErrors, setFieldErrors] = useState(initialErrors);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Prefill dari payload ────────────────────────────────────────────────────
  // Identity (nama/username/email) tidak diedit di halaman ini — hanya dikirim
  // ulang apa adanya dari payload saat submit. Sisanya bisa diperbaiki user.
  const name = fixData?.name || "";
  const username = fixData?.username || "";
  const email = fixData?.email || "";
  const [birthdate, setBirthdate] = useState(fixData?.birthdate || "");
  const [schoolName, setSchoolName] = useState(fixData?.schoolName || "");

  // Lokasi saat ini
  const [provinces, setProvinces] = useState([]);
  const [provinceId, setProvinceId] = useState(fixData?.provinceId || "");
  const [regencies, setRegencies] = useState([]);
  const [regencyLoading, setRegencyLoading] = useState(false);
  const [regionId, setRegionId] = useState(fixData?.regionId || "");

  // Pelatihan Gasing
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [kapanYear, setKapanYear] = useState(
    fixData?.firstTrainingYear ? String(fixData.firstTrainingYear) : ""
  );
  const [kapanMonth, setKapanMonth] = useState(
    fixData?.firstTrainingMonth ? String(fixData.firstTrainingMonth - 1) : ""
  );
  const [lastTrainingSessionId, setLastTrainingSessionId] = useState(
    fixData?.lastTrainingSessionId || ""
  );

  // Hapus error field begitu user mengeditnya (bubble dinamis hilang).
  const clearErr = (key) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  useEffect(() => {
    regionsApi.list().then((d) => setProvinces(asList(d))).catch(() => setProvinces([]));
    trainingSessionsApi
      .list({ limit: 100 })
      .then((d) => setSessions(asList(d)))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  // Prefill kab/kota kalau provinsi sudah diketahui dari payload.
  useEffect(() => {
    if (!provinceId) return;
    setRegencyLoading(true);
    regionsApi
      .list({ type: "REGENCY", parentId: provinceId })
      .then((d) => setRegencies(asList(d)))
      .catch(() => setRegencies([]))
      .finally(() => setRegencyLoading(false));
  }, [provinceId]);

  const handleProvinceChange = (v) => {
    setProvinceId(v);
    setRegionId("");
    clearErr("lokasi");
  };

  const handleYearChange = (v) => {
    setKapanYear(v);
    setKapanMonth("");
    setLastTrainingSessionId("");
  };
  const handleMonthChange = (v) => {
    setKapanMonth(v);
    setLastTrainingSessionId("");
  };
  const handleSessionChange = (v) => {
    setLastTrainingSessionId(v);
    clearErr("riwayatPelatihan");
  };

  const yearOptions = [...new Set(sessions.map(sessionYear).filter(Boolean))]
    .sort()
    .reverse();
  const monthOptions = [
    ...new Set(
      sessions.filter((s) => sessionYear(s) === kapanYear).map(sessionMonth).filter(Boolean)
    ),
  ].sort((a, b) => Number(a) - Number(b));
  const dimanaOptions = sessions.filter(
    (s) => sessionYear(s) === kapanYear && sessionMonth(s) === kapanMonth
  );

  // Validasi lalu langsung submit (tanpa modal konfirmasi — sesuai desain terbaru).
  const handleSubmit = () => {
    setError("");
    if (!birthdate || !regionId || !lastTrainingSessionId || !schoolName) {
      setError("Semua field wajib diisi");
      return;
    }
    if (Object.keys(fieldErrors).length > 0) {
      setError("Masih ada data yang ditandai salah. Perbaiki dulu sebelum mengirim.");
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    setLoading(true);
    try {
      const selectedSession = sessions.find((s) => s.id === lastTrainingSessionId);
      const payload = {
        // Nama/Username/Email tidak diedit di halaman ini — dikirim ulang apa adanya.
        name,
        username,
        email,
        birthdate,
        regionId,
        firstTrainingYear: Number(kapanYear),
        firstTrainingMonth: Number(kapanMonth) + 1,
        firstTrainingRegionId:
          selectedSession?.regionId ?? selectedSession?.region?.id ?? null,
        lastTrainingSessionId,
        schoolName,
      };

      if (reviseToken) {
        // Alur baru (token JWT dari email): auth via token, bukan uid.
        await authApi.submitRevise({ token: reviseToken, ...payload });
      } else {
        // Legacy (?fix= self-contained) — dihapus setelah backend stabil (ADR-0003).
        await authApi.submitCorrection({ uid: fixData?.uid, ...payload });
      }
      setSubmitted(true);
    } catch (e) {
      setError(e.message || "Gagal mengirim perbaikan data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sukses: perbaikan terkirim, akun masuk antrian review ────────────────────
  if (submitted) {
    return (
      <>
        {/* MOBILE — layar gelap "Akunmu Sedang Ditinjau Kembali" */}
        <MobileReviewNotice
          icon={UserSearch}
          title="Akunmu Sedang Ditinjau Kembali"
          onButton={() => onNavigate("login")}
        >
          Terima kasih telah mengajukan perbaikan data. Tim kami akan segera
          memeriksa informasi yang kamu kirimkan. Proses peninjauan akan memakan
          waktu <span className="font-semibold text-white">24 - 48 jam</span>.
          <br /><br />
          Mohon cek email secara berkala untuk status perbaikan akunmu.
        </MobileReviewNotice>

        {/* DESKTOP — versi terang existing */}
        <div className="hidden lg:block">
      <RightPanel>
        <div className="animate-fade-in-up text-center space-y-5 max-w-[380px] mx-auto">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 border border-dashed border-orange-400 flex items-center justify-center">
            <UserSearch className="text-orange-500" size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-[22px] font-bold text-foreground">Akunmu Sedang Ditinjau Kembali</h1>
          <p className="text-[13px] text-muted-foreground px-2 leading-relaxed">
            Terima kasih telah mengajukan perbaikan data diri. Tim kami akan segera
            memeriksa informasi yang kamu kirimkan.{" "}
            <span className="font-semibold text-foreground">
              Proses peninjauan akan memakan waktu 24 - 48 jam.
            </span>
          </p>
          <div className="flex items-start gap-2.5 text-left bg-blue-50 rounded-xl px-4 py-3">
            <HelpCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[13px] text-slate-600">
              Mohon cek email secara berkala untuk melihat status akunmu.
            </p>
          </div>
          <div className="border-t border-gray-100" />
          <Button
            className="rounded-full px-10 mx-auto"
            onClick={() => onNavigate("login")}
          >
            <LogIn size={16} /> Kembali ke Log in
          </Button>
        </div>
      </RightPanel>
        </div>
      </>
    );
  }

  return (
    <RightPanel>
      {/* Header dengan tombol tutup (X) — muncul di mobile & desktop */}
      <div className="animate-fade-in-up delay-100 relative mb-2">
        <button
          onClick={() => onNavigate("login")}
          className="absolute right-0 top-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Tutup"
        >
          <X size={22} />
        </button>
        <h1 className="text-[22px] font-bold text-foreground text-center mb-1.5">Perbaikan Data</h1>
        <p className="text-[13px] text-muted-foreground text-center px-6">
          Silakan lengkapi dan perbaiki data berikut sesuai tindakan perbaikan yang
          diperlukan.
        </p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <ErrorAlert message={error} />

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">
            Tanggal lahir <span className="text-red-500">*</span>
          </Label>
          <IconInput
            icon={Calendar}
            type="date"
            value={birthdate}
            onChange={(e) => { setBirthdate(e.target.value); clearErr("tanggalLahir"); }}
            className={cn(fieldErrors.tanggalLahir && errCls)}
          />
          <FieldError message={fieldErrors.tanggalLahir} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Lokasi kamu saat ini</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={provinceId} onValueChange={handleProvinceChange}>
              <SelectTrigger className={cn(fieldErrors.lokasi && errCls)}>
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.regionName || p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={regionId}
              onValueChange={(v) => { setRegionId(v); clearErr("lokasi"); }}
              disabled={!provinceId || regencyLoading}
            >
              <SelectTrigger className={cn(fieldErrors.lokasi && errCls)}>
                <SelectValue placeholder={regencyLoading ? "Memuat..." : "Pilih Kab./Kota"} />
              </SelectTrigger>
              <SelectContent>
                {regencies.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.regionName || r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FieldError message={fieldErrors.lokasi} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Kapan kamu mendapat pelatihan Gasing pertama?</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={kapanYear} onValueChange={handleYearChange} disabled={sessionsLoading}>
              <SelectTrigger className={cn(fieldErrors.riwayatPelatihan && errCls)}>
                <SelectValue placeholder={sessionsLoading ? "Memuat..." : "Tahun"} />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kapanMonth} onValueChange={handleMonthChange} disabled={!kapanYear}>
              <SelectTrigger className={cn(fieldErrors.riwayatPelatihan && errCls)}>
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>{MONTHS[Number(m)]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Dimana kamu mendapat pelatihan Gasing pertama?</Label>
          <Select value={lastTrainingSessionId} onValueChange={handleSessionChange} disabled={!kapanMonth}>
            <SelectTrigger className={cn(fieldErrors.riwayatPelatihan && errCls)}>
              <SelectValue placeholder="Pilih Daerah" />
            </SelectTrigger>
            <SelectContent>
              {dimanaOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.riwayatPelatihan} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">
            Sekolah asal kamu saat pelatihan Gasing pertama? <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Nama sekolah"
            value={schoolName}
            onChange={(e) => { setSchoolName(e.target.value); clearErr("namaSekolah"); }}
            className={cn(fieldErrors.namaSekolah && errCls)}
          />
          <FieldError message={fieldErrors.namaSekolah} />
        </div>

        <Button className="w-full rounded-full" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
          ) : (
            "Kirim Perbaikan Data"
          )}
        </Button>
      </div>
    </RightPanel>
  );
}
