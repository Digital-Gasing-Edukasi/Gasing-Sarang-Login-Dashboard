import { RightPanel } from "@/components/layout/RightPanel";
import { StepBar } from "@/components/layout/StepIndicator";
import { DATE_MAX, DateField } from "@/components/shared/DateField";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { MobileReviewNotice } from "@/components/shared/MobileReviewNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi, regionsApi, tokenStorage } from "@/lib/api";
import { abbrevRegion } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HelpCircle, Loader2, LogIn, UserSearch } from "lucide-react";
import { useEffect, useState } from "react";

const asList = (data) =>
  Array.isArray(data) ? data : data?.data || data?.items || [];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Style border merah saat field invalid (dipakai Input & SelectTrigger).
const errCls = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 focus:border-red-500 focus:ring-red-500/30";

// Placeholder dropdown "langkah berikutnya" (Kab/Kota atau Bulan) saat
// pasangannya (Provinsi / Tahun) sudah terisi tapi field ini belum.
const PLACEHOLDER_HINT =
  "!text-[#D1D3DA] data-[placeholder]:!text-[#D1D3DA] [&_span]:!text-[#D1D3DA]";

// Field yang BISA diperbaiki user di halaman ini (lihat desain — Nama/Username/Email
// tidak ditampilkan, hanya dikirim ulang apa adanya dari payload). Penanda error
// hanya untuk key di sini agar submit tidak tersangkut field yang tak punya input.
const CORRECTABLE_KEYS = ["tanggalLahir", "lokasi", "riwayatPelatihan", "namaSekolah"];

// Pesan error merah di bawah field yang salah (border merah + teks, gap 4px audit #10).
function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[13px] text-red-500 animate-fade-in">{message}</p>;
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

  // Pelatihan Gasing — Kapan (tahun & bulan, independen) + Daerah pelatihan
  // pertama (Provinsi → Kab/Kota = firstTrainingRegionId), sama seperti
  // SignUpPage (sesi pelatihan digantikan region).
  const [kapanYear, setKapanYear] = useState(
    fixData?.firstTrainingYear ? String(fixData.firstTrainingYear) : ""
  );
  const [kapanMonth, setKapanMonth] = useState(
    fixData?.firstTrainingMonth ? String(fixData.firstTrainingMonth - 1) : ""
  );
  const [trainingProvinceId, setTrainingProvinceId] = useState(
    fixData?.trainingProvinceId || ""
  );
  const [trainingRegencies, setTrainingRegencies] = useState([]);
  const [trainingRegencyLoading, setTrainingRegencyLoading] = useState(false);
  const [trainingRegionId, setTrainingRegionId] = useState(
    fixData?.firstTrainingRegionId || ""
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
  }, []);

  // Daftar kab/kota anak suatu provinsi (dipakai Lokasi + Daerah pelatihan).
  const fetchRegencies = (parentId) =>
    regionsApi
      .list({ type: "REGENCY", parentId })
      .then((d) => asList(d))
      .catch(() => []);

  // Prefill kab/kota kalau provinsi sudah diketahui dari payload.
  // Audit #93: payload kadang hanya bawa regionId tanpa provinceId → resolve
  // induk via detail region (regionsApi.get, pola sama fetchRevisePrefill),
  // bukan bulk-list.
  useEffect(() => {
    if (provinceId || !regionId) return;
    let cancelled = false;
    regionsApi
      .get(regionId)
      .then((d) => {
        if (cancelled) return;
        const r = d?.data || d || {};
        const parent = r.parentId || r.parent?.id || null;
        if (parent) setProvinceId(String(parent));
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  // Prefill kab/kota kalau provinsi sudah diketahui dari payload.
  useEffect(() => {
    if (!provinceId) return;
    setRegencyLoading(true);
    fetchRegencies(provinceId).then((d) => {
      setRegencies(d);
      setRegencyLoading(false);
    });
  }, [provinceId]);

  // Prefill "Daerah pelatihan pertama": dari payload (firstTrainingRegionId),
  // resolve provinsi induknya kalau belum ada, lalu muat daftar kab/kotanya.
  useEffect(() => {
    if (!trainingRegionId) return;
    let cancelled = false;
    const load = async () => {
      let parentId = trainingProvinceId;
      if (!parentId) {
        try {
          const d = await regionsApi.get(trainingRegionId);
          const r = d?.data || d || {};
          parentId = String(r.parentId || r.parent?.id || "");
        } catch {
          parentId = "";
        }
      }
      if (cancelled) return;
      if (parentId) setTrainingProvinceId(parentId);
      setTrainingRegencyLoading(true);
      const list = await fetchRegencies(parentId);
      if (cancelled) return;
      setTrainingRegencies(list);
      setTrainingRegencyLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingRegionId]);

  const handleProvinceChange = (v) => {
    setProvinceId(v);
    setRegionId("");
    clearErr("lokasi");
  };

  const handleYearChange = (v) => {
    setKapanYear(v);
    setKapanMonth("");
  };
  const handleMonthChange = (v) => {
    setKapanMonth(v);
  };

  const handleTrainingProvinceChange = (v) => {
    setTrainingProvinceId(v);
    setTrainingRegionId("");
    clearErr("riwayatPelatihan");
    setTrainingRegencies([]);
    setTrainingRegencyLoading(true);
    fetchRegencies(v).then((d) => {
      setTrainingRegencies(d);
      setTrainingRegencyLoading(false);
    });
  };

  const handleTrainingRegionChange = (v) => {
    setTrainingRegionId(v);
    clearErr("riwayatPelatihan");
  };

  // Tahun pelatihan: 2024 → tahun berjalan (independen, sama seperti SignUp).
  // Kalau prefill dari payload di luar rentang itu, tetap ikut ditampilkan
  // supaya nilai lama user tidak hilang.
  const yearOptions = (() => {
    const current = Math.max(new Date().getFullYear(), 2024);
    const years = new Set();
    for (let y = current; y >= 2024; y -= 1) years.add(String(y));
    if (kapanYear) years.add(kapanYear);
    return [...years].sort().reverse();
  })();
  // Bulan tampil penuh (12 bulan) agar prefill dari payload selalu cocok.
  const monthOptions = Array.from({ length: 12 }, (_, i) => String(i));

  // Validasi lalu langsung submit (tanpa modal konfirmasi — sesuai desain terbaru).
  const handleSubmit = () => {
    setError("");
    if (!birthdate || !regionId || !trainingRegionId || !schoolName) {
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
      const payload = {
        // Nama/Username/Email tidak diedit di halaman ini — dikirim ulang apa adanya.
        name,
        username,
        email,
        birthdate,
        regionId,
        firstTrainingYear: Number(kapanYear),
        firstTrainingMonth: Number(kapanMonth) + 1,
        firstTrainingRegionId: trainingRegionId,
        schoolName,
      };
      // Token revise (JWT dari email) diutamakan; aliran Daftar Ulang tak punya
      // itu (null/'') → pakai accessToken sesi saat ini (provisional login).
      const submitToken = reviseToken || tokenStorage.getAccess() || null;
      await authApi.submitRevise({ token: submitToken, ...payload });

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
        <div className="hidden lg:block w-full">
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

  // CTA dipakai di footer sticky (mobile) & inline (desktop).
  // Audit #90: tanpa tombol close — gantinya "Kembali ke Log In" di bawah CTA, gap 16px.
  const backToLogin = (
    <button
      onClick={() => onNavigate("login")}
      className="w-full rounded-full border border-[#D1D3DA] bg-white py-3.5 text-sm font-semibold text-[#030B1F] transition-colors hover:bg-gray-50"
    >
      Kembali ke Log In
    </button>
  );
  const cta = (
    <div className="flex flex-col gap-4">
      <Button
        className="w-full rounded-full"
        onClick={handleSubmit}
        disabled={loading || !birthdate || !regionId || !trainingRegionId || !schoolName}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
        ) : (
          "Kirim Perbaikan Data"
        )}
      </Button>
      {backToLogin}
    </div>
  );

  // DESKTOP: tombol inline saja. MOBILE: hanya footer sticky (anti dobel).
  return (
    <RightPanel stickyFooter={cta} footerWrapClassName="lg:hidden">
      {/* MOBILE: header tanpa tombol close (audit #90) — hanya judul. */}
      <div className="lg:hidden sticky top-0 z-20 -mx-6 -mt-4 mb-4 bg-background/95 px-6 pt-4 pb-4 backdrop-blur">
        <StepBar title="Perbaikan Data" />
      </div>

      {/* DESKTOP: header inline judul saja (audit #90 tanpa X, #91 tanpa subtitle). */}
      <div className="hidden lg:block animate-fade-in-up delay-100 relative mb-2">
        <h1 className="text-[22px] font-bold text-foreground text-center mb-1.5">Perbaikan Data</h1>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <ErrorAlert message={error} />

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">
            Tanggal lahir <span className="text-red-500">*</span>
          </Label>
          {/* Audit #92: samakan dengan SignUp step 1 (DateField roda, bukan native date). */}
          <DateField
            value={birthdate}
            maxDate={DATE_MAX.yesterday()}
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
              <SelectTrigger
                className={cn(
                  fieldErrors.lokasi && errCls,
                  provinceId && !regionId && PLACEHOLDER_HINT,
                )}
              >
                <SelectValue placeholder={regencyLoading ? "Memuat..." : "Pilih Kab./Kota"} />
              </SelectTrigger>
              <SelectContent>
                {regencies.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{abbrevRegion(r.regionName || r.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FieldError message={fieldErrors.lokasi} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Kapan kamu mendapat pelatihan Gasing pertama?</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={kapanYear} onValueChange={handleYearChange}>
              <SelectTrigger className={cn(fieldErrors.riwayatPelatihan && errCls)}>
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kapanMonth} onValueChange={handleMonthChange} disabled={!kapanYear}>
              <SelectTrigger
                className={cn(
                  fieldErrors.riwayatPelatihan && errCls,
                  kapanYear && !kapanMonth && PLACEHOLDER_HINT,
                )}
              >
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
          <Label className="text-[13px] font-semibold">
            Daerah pelatihan pertama? <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={trainingProvinceId}
              onValueChange={handleTrainingProvinceChange}
            >
              <SelectTrigger className={cn(fieldErrors.riwayatPelatihan && errCls)}>
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.regionName || p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={trainingRegionId}
              onValueChange={handleTrainingRegionChange}
              disabled={!trainingProvinceId || trainingRegencyLoading}
            >
              <SelectTrigger
                className={cn(
                  fieldErrors.riwayatPelatihan && errCls,
                  trainingProvinceId && !trainingRegionId && PLACEHOLDER_HINT,
                )}
              >
                <SelectValue
                  placeholder={trainingRegencyLoading ? "Memuat..." : "Pilih Kab./Kota"}
                />
              </SelectTrigger>
              <SelectContent>
                {trainingRegencies.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {abbrevRegion(r.regionName || r.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

        {/* DESKTOP: tombol inline. MOBILE: dipindah ke footer sticky. */}
        <div className="hidden lg:block">{cta}</div>
      </div>
    </RightPanel>
  );
}
