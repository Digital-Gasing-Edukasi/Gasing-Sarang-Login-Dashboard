import { useState, useEffect } from "react";
import { Mail, Lock, LogIn, Calendar, Loader2, Check, Circle } from "lucide-react";
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
import { RightPanel, Divider } from "@/components/layout/RightPanel";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { IconInput, TogglePassword } from "@/components/shared/IconInput";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { authApi, regionsApi, trainingSessionsApi } from "@/lib/api";

const asList = (data) =>
  Array.isArray(data) ? data : data?.data || data?.items || [];

const sessionDate = (s) => {
  const sd = s.startDate;
  const raw = sd?.utc?.raw ?? (typeof sd === "string" ? sd : null);
  const d = sd?.unix ? new Date(sd.unix * 1000) : raw ? new Date(raw) : null;
  return d && !isNaN(d) ? d : null;
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "Kapan" = tahun + bulan pelatihan
const sessionYear = (s) => {
  const d = sessionDate(s);
  return d ? String(d.getFullYear()) : "";
};

const sessionMonth = (s) => {
  const d = sessionDate(s);
  return d ? String(d.getMonth()) : "";
};

export function SignUpPage({ onNavigate, onOtpToken }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Lokasi saat ini (Provinsi → Kab/Kota = regionId)
  const [provinces, setProvinces] = useState([]);
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [provinceId, setProvinceId] = useState("");
  const [regencies, setRegencies] = useState([]);
  const [regencyLoading, setRegencyLoading] = useState(false);
  const [regionId, setRegionId] = useState("");

  // Pelatihan Gasing: Kapan (filter) → Dimana (session = lastTrainingSessionId)
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [kapanYear, setKapanYear] = useState("");
  const [kapanMonth, setKapanMonth] = useState("");
  const [lastTrainingSessionId, setLastTrainingSessionId] = useState("");

  useEffect(() => {
    regionsApi
      .list()
      .then((d) => setProvinces(asList(d)))
      .catch(() => setProvinces([]))
      .finally(() => setProvincesLoading(false));

    trainingSessionsApi
      .list({ limit: 100 })
      .then((d) => setSessions(asList(d)))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  const handleProvinceChange = (v) => {
    setProvinceId(v);
    setRegionId("");
    setRegencies([]);
    setRegencyLoading(true);
    regionsApi
      .list({ type: "REGENCY", parentId: v })
      .then((d) => setRegencies(asList(d)))
      .catch(() => setRegencies([]))
      .finally(() => setRegencyLoading(false));
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

  const yearOptions = [...new Set(sessions.map(sessionYear).filter(Boolean))]
    .sort()
    .reverse();
  const monthOptions = [
    ...new Set(
      sessions
        .filter((s) => sessionYear(s) === kapanYear)
        .map(sessionMonth)
        .filter(Boolean),
    ),
  ].sort((a, b) => Number(a) - Number(b));
  const dimanaOptions = sessions.filter(
    (s) => sessionYear(s) === kapanYear && sessionMonth(s) === kapanMonth,
  );

  const passwordRules = [
    { label: "Minimal 8 karakter", ok: password.length >= 8 },
    { label: "Minimal 1 huruf kapital", ok: /[A-Z]/.test(password) },
    {
      label: "Minimal 1 angka dan 1 karakter spesial",
      ok: /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
    },
  ];
  const allRulesOk = passwordRules.every((r) => r.ok);
  const showPasswordRules = passwordFocused || password.length > 0;

  const handleNextToData = () => {
    setError("");
    if (!name || !username || !email || !password || !confirm) {
      setError("Semua field wajib diisi");
      return;
    }

    if (username.length < 3) {
      setError("Username minimal 3 karakter");
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(username)) {
      setError(
        "Username harus diawali huruf kecil dan hanya berisi huruf kecil, angka, dan underscore",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    if (!allRulesOk) {
      setError("Password belum memenuhi semua ketentuan");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    setError("");
    if (!birthdate || !regionId || !lastTrainingSessionId || !schoolName) {
      setError("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.register({
        username,
        email,
        password,
        name,
        birthdate,
        regionId,
        lastTrainingSessionId,
        schoolName,
      });
      onOtpToken(data.token, email);
      onNavigate("signup-otp");
    } catch (e) {
      const msg = e.message;
      setError(msg);

      const msgLower = msg.toLowerCase();
      if (
        msgLower.includes("username") ||
        msgLower.includes("email") ||
        msgLower.includes("password")
      ) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RightPanel>
      <StepIndicator currentStep={step === 1 ? 1 : 2} />

      {step === 1 ? (
        <>
          <div className="animate-fade-in-up delay-100 text-center">
            <h1 className="text-[22px] font-bold text-foreground mb-1.5">
              Buat Akun Baru
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              Silakan isi data di bawah ini untuk buat akun.
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
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Username</Label>
              <Input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Email</Label>
              <IconInput
                icon={Mail}
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Password</Label>
              <IconInput
                icon={Lock}
                type={showPass ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                iconRight={
                  <TogglePassword
                    show={showPass}
                    onToggle={() => setShowPass((v) => !v)}
                  />
                }
              />
              {showPasswordRules && (
                <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[13px] font-medium text-foreground">
                    Password kamu harus memiliki:
                  </p>
                  <ul className="space-y-1.5">
                    {passwordRules.map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-2 text-[12px] transition-colors ${
                          rule.ok ? "text-green-600" : "text-muted-foreground"
                        }`}
                      >
                        {rule.ok ? (
                          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : (
                          <div className="h-4 w-4 flex-shrink-0 rounded-full border-[1.5px] border-dashed border-muted-foreground/50" />
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Konfirmasi Password</Label>
              <IconInput
                icon={Lock}
                type={showConfirm ? "text" : "password"}
                placeholder="Konfirmasi password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                iconRight={
                  <TogglePassword
                    show={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                  />
                }
              />
            </div>
            <Button className="w-full" onClick={handleNextToData}>
              Lanjutkan
            </Button>
          </div>

          <Divider />
          <div className="animate-fade-in-up delay-300 space-y-4">
            <p className="text-[13px] text-muted-foreground text-center px-4">
              Dengan mendaftar akun, kamu menyetujui{" "}
              <a
                href="#"
                className="underline font-medium text-blue-500 hover:text-blue-600"
              >
                Ketentuan Layanan
              </a>{" "}
              dan{" "}
              <a
                href="#"
                className="underline font-medium text-blue-500 hover:text-blue-600"
              >
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors mx-auto"
            >
              <LogIn size={16} /> Log In
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="animate-fade-in-up delay-100 relative text-center">
            <button
              onClick={() => setStep(1)}
              className="absolute -top-8 left-0 text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Kembali
            </button>
            <h1 className="text-[22px] font-bold text-foreground mb-1.5">
              Verifikasi Data
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              Silakan masukkan verifikasi data diri yang sesuai.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-200">
            <ErrorAlert message={error} />
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Tanggal Lahir</Label>
              <IconInput
                icon={Calendar}
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Lokasi kamu saat ini</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={provinceId}
                  onValueChange={handleProvinceChange}
                  disabled={provincesLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        provincesLoading ? "Memuat..." : "Pilih Provinsi"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.regionName || p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={regionId}
                  onValueChange={setRegionId}
                  disabled={!provinceId || regencyLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        regencyLoading ? "Memuat..." : "Pilih Kab./Kota"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {regencies.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.regionName || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Kapan kamu mendapat pelatihan Gasing pertama?</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={kapanYear}
                  onValueChange={handleYearChange}
                  disabled={sessionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={sessionsLoading ? "Memuat..." : "Tahun"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={kapanMonth}
                  onValueChange={handleMonthChange}
                  disabled={!kapanYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MONTHS[Number(m)]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Dimana kamu mendapat pelatihan Gasing pertama?</Label>
              <Select
                value={lastTrainingSessionId}
                onValueChange={setLastTrainingSessionId}
                disabled={!kapanMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Daerah" />
                </SelectTrigger>
                <SelectContent>
                  {dimanaOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Sekolah asal kamu saat pelatihan Gasing pertama?</Label>
              <Input
                placeholder="Nama sekolah"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Mendaftarkan...
                </>
              ) : (
                "Lanjutkan"
              )}
            </Button>
          </div>

          <div className="animate-fade-in-up delay-300 mt-6 space-y-4">
            <p className="text-[13px] text-muted-foreground text-center px-4">
              Dengan mengklik lanjutkan, kamu menyetujui{" "}
              <a
                href="#"
                className="underline font-medium text-blue-500 hover:text-blue-600"
              >
                Ketentuan Layanan
              </a>{" "}
              dan{" "}
              <a
                href="#"
                className="underline font-medium text-blue-500 hover:text-blue-600"
              >
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors mx-auto mt-4"
            >
              <LogIn size={16} /> Log In
            </button>
          </div>
        </>
      )}
    </RightPanel>
  );
}
