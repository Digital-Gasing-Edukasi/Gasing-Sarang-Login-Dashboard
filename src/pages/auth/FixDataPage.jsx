import { useState, useEffect } from "react";
import { Mail, Calendar, Loader2, LogIn, CheckCircle2 } from "lucide-react";
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
import { RightPanel } from "@/components/layout/RightPanel";
import { IconInput } from "@/components/shared/IconInput";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { cn } from "@/lib/utils";
import { authApi, regionsApi, trainingSessionsApi } from "@/lib/api";
import { defaultFieldMessage } from "@/lib/fixLink";

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

// Bubble notifikasi di bawah field yang salah.
function ErrorBubble({ message }) {
  if (!message) return null;
  return (
    <div className="relative mt-1.5 animate-fade-in">
      <div className="absolute -top-1 left-4 w-2.5 h-2.5 bg-red-600 rotate-45" />
      <div className="relative bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-md">
        {message}
      </div>
    </div>
  );
}

export function FixDataPage({ fixData, onNavigate }) {
  // Map invalid[] + notes{} → { [fieldKey]: pesan }. Sumber bubble dinamis.
  const initialErrors = () => {
    const errs = {};
    (fixData?.invalid || []).forEach((k) => {
      errs[k] = fixData?.notes?.[k] || defaultFieldMessage(k);
    });
    return errs;
  };

  const [fieldErrors, setFieldErrors] = useState(initialErrors);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Prefill dari payload ────────────────────────────────────────────────────
  const [name, setName] = useState(fixData?.name || "");
  const [username, setUsername] = useState(fixData?.username || "");
  const [email, setEmail] = useState(fixData?.email || "");
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
    clearErr("region");
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
    clearErr("training");
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

  const handleSubmit = async () => {
    setError("");
    if (!name || !username || !email || !birthdate || !regionId || !lastTrainingSessionId || !schoolName) {
      setError("Semua field wajib diisi");
      return;
    }
    if (Object.keys(fieldErrors).length > 0) {
      setError("Masih ada data yang ditandai salah. Perbaiki dulu sebelum mengirim.");
      return;
    }
    setLoading(true);
    try {
      const selectedSession = sessions.find((s) => s.id === lastTrainingSessionId);
      await authApi.submitCorrection({
        uid: fixData?.uid,
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
      });
      setSubmitted(true);
    } catch (e) {
      setError(e.message || "Gagal mengirim perbaikan data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sukses ──────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <RightPanel>
        <div className="animate-fade-in-up text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-50 border border-dashed border-green-500 flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={30} strokeWidth={1.5} />
          </div>
          <h1 className="text-[22px] font-bold text-foreground">Data Berhasil Dikirim</h1>
          <p className="text-[13px] text-muted-foreground px-4">
            Terima kasih. Data kamu sudah diperbarui dan akan ditinjau ulang oleh admin.
          </p>
          <button
            onClick={() => onNavigate("login")}
            className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors mx-auto"
          >
            <LogIn size={16} /> Log In
          </button>
        </div>
      </RightPanel>
    );
  }

  return (
    <RightPanel>
      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-[22px] font-bold text-foreground mb-1.5">Perbaiki Data Kamu</h1>
        <p className="text-[13px] text-muted-foreground mb-6 px-2">
          Akun kamu sudah dibuat, tapi ada data yang perlu diperbaiki. Field bertanda{" "}
          <span className="text-red-600 font-medium">merah</span> di bawah harus dibetulkan.
        </p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <ErrorAlert message={error} />

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Nama Lengkap</Label>
          <Input
            type="text"
            placeholder="Masukkan nama lengkap"
            value={name}
            onChange={(e) => { setName(e.target.value); clearErr("name"); }}
            className={cn(fieldErrors.name && errCls)}
          />
          <ErrorBubble message={fieldErrors.name} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Username</Label>
          <Input
            type="text"
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearErr("username"); }}
            className={cn(fieldErrors.username && errCls)}
          />
          <ErrorBubble message={fieldErrors.username} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Email</Label>
          <IconInput
            icon={Mail}
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearErr("email"); }}
            className={cn(fieldErrors.email && errCls)}
          />
          <ErrorBubble message={fieldErrors.email} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Tanggal Lahir</Label>
          <IconInput
            icon={Calendar}
            type="date"
            value={birthdate}
            onChange={(e) => { setBirthdate(e.target.value); clearErr("birthdate"); }}
            className={cn(fieldErrors.birthdate && errCls)}
          />
          <ErrorBubble message={fieldErrors.birthdate} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Lokasi kamu saat ini</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={provinceId} onValueChange={handleProvinceChange}>
              <SelectTrigger className={cn(fieldErrors.region && errCls)}>
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
              onValueChange={(v) => { setRegionId(v); clearErr("region"); }}
              disabled={!provinceId || regencyLoading}
            >
              <SelectTrigger className={cn(fieldErrors.region && errCls)}>
                <SelectValue placeholder={regencyLoading ? "Memuat..." : "Pilih Kab./Kota"} />
              </SelectTrigger>
              <SelectContent>
                {regencies.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.regionName || r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ErrorBubble message={fieldErrors.region} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Kapan kamu mendapat pelatihan Gasing pertama?</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={kapanYear} onValueChange={handleYearChange} disabled={sessionsLoading}>
              <SelectTrigger className={cn(fieldErrors.training && errCls)}>
                <SelectValue placeholder={sessionsLoading ? "Memuat..." : "Tahun"} />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kapanMonth} onValueChange={handleMonthChange} disabled={!kapanYear}>
              <SelectTrigger className={cn(fieldErrors.training && errCls)}>
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
            <SelectTrigger className={cn(fieldErrors.training && errCls)}>
              <SelectValue placeholder="Pilih Daerah" />
            </SelectTrigger>
            <SelectContent>
              {dimanaOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorBubble message={fieldErrors.training} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Sekolah asal kamu saat pelatihan Gasing pertama?</Label>
          <Input
            placeholder="Nama sekolah"
            value={schoolName}
            onChange={(e) => { setSchoolName(e.target.value); clearErr("school"); }}
            className={cn(fieldErrors.school && errCls)}
          />
          <ErrorBubble message={fieldErrors.school} />
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
          ) : (
            "Kirim Perbaikan"
          )}
        </Button>
      </div>

      <div className="animate-fade-in-up delay-300 mt-6">
        <button
          onClick={() => onNavigate("login")}
          className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors mx-auto"
        >
          <LogIn size={16} /> Log In
        </button>
      </div>
    </RightPanel>
  );
}
