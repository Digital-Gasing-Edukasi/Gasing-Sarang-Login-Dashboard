import { useState, useEffect } from "react";
import { Mail, Lock, LogIn, Calendar, Loader2 } from "lucide-react";
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
import { authApi, regionsApi } from "@/lib/api";

export function SignUpPage({ onNavigate, onOtpToken }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [regionId, setRegionId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);

  useEffect(() => {
    regionsApi
      .list()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || data.items || [];
        setRegions(list);
      })
      .catch(() => setRegions([]))
      .finally(() => setRegionsLoading(false));
  }, []);

  const handleNextToData = () => {
    setError("");
    if (!username || !email || !password || !confirm) {
      setError("Semua field wajib diisi");
      return;
    }

    // Validasi Username
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

    // Validasi Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    // Validasi Password
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    setError("");
    if (!name || !birthdate || !regionId || !schoolName) {
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
        trainingRegionId: regionId,
        schoolName,
      });
      onOtpToken(data.token, email);
      onNavigate("signup-otp");
    } catch (e) {
      const msg = e.message;
      setError(msg);

      // Jika error dari backend berkaitan dengan field di step 1, otomatis kembali ke step 1
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
          <div className="animate-fade-in-up delay-100">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Daftar Akun Baru
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Silakan isi data di bawah ini untuk buat akun.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-200">
            <ErrorAlert message={error} />
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <IconInput
                icon={Mail}
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <IconInput
                icon={Lock}
                type={showPass ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconRight={
                  <TogglePassword
                    show={showPass}
                    onToggle={() => setShowPass((v) => !v)}
                  />
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password</Label>
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
          <div className="animate-fade-in-up delay-300 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Dengan mendaftar, Anda menyetujui{" "}
              <a
                href="#"
                className="underline text-foreground/70 hover:text-foreground"
              >
                Ketentuan Layanan
              </a>{" "}
              dan{" "}
              <a
                href="#"
                className="underline text-foreground/70 hover:text-foreground"
              >
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <LogIn size={15} /> Sudah punya akun? Login
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="animate-fade-in-up delay-100 relative">
            <button
              onClick={() => setStep(1)}
              className="absolute -top-8 left-0 text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Kembali
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Verifikasi Data
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Silakan masukkan verifikasi data diri yang sesuai.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-200">
            <ErrorAlert message={error} />
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Lahir</Label>
              <IconInput
                icon={Calendar}
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dimana kamu mendapat pelatihan Gasing pertama?</Label>
              <Select
                value={regionId}
                onValueChange={setRegionId}
                disabled={regionsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={regionsLoading ? "Memuat..." : "Pilih"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.regionName || r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Sekolah</Label>
              <Input
                placeholder="Masukkan nama sekolah"
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

          <div className="animate-fade-in-up delay-300 mt-6 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Dengan mengklik lanjutkan, Anda menyetujui{" "}
              <a
                href="#"
                className="underline text-blue-500 hover:text-blue-600"
              >
                Ketentuan Layanan
              </a>{" "}
              dan{" "}
              <a
                href="#"
                className="underline text-blue-500 hover:text-blue-600"
              >
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="flex items-center gap-1.5 text-sm text-foreground font-semibold hover:text-foreground/80 transition-colors mx-auto mt-4"
            >
              <LogIn size={15} /> Login
            </button>
          </div>
        </>
      )}
    </RightPanel>
  );
}
