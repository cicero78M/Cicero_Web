"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import DarkModeToggle from "@/components/DarkModeToggle";
import useAuth from "@/hooks/useAuth";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { normalizeWhatsapp, requestDashboardPasswordReset } from "@/utils/api";

export default function LoginPage() {
  useAuthRedirect(); // Akan redirect ke /dashboard jika sudah login
  const { setAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [client_id, setClientId] = useState("");
  const [role, setRole] = useState("");
  const [formMode, setFormMode] = useState("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [forgotUsername, setForgotUsername] = useState("");
  const [recoveryContact, setRecoveryContact] = useState("");
  const router = useRouter();
  const handleTrim = (setter) => (e) => setter(e.target.value.trim());
  const networkErrorMessage =
    "Server tidak merespons. Silakan hubungi admin Cicero.";

  useEffect(() => {
    setError("");
    setMessage("");
    setLoading(false);
  }, [formMode]);

  const handleNetworkFailure = () => {
    if (typeof window !== "undefined") {
      window.alert(networkErrorMessage);
    }
  };

  const highlightItems = useMemo(
    () => [
      {
        icon: <Sparkles className="h-4 w-4 text-sky-500" />,
        title: "Kepercayaan Terukur",
        description:
          "Panel transparan menampilkan progres lintas channel sehingga setiap keputusan dilandasi data yang akurat dan mudah diaudit.",
      },
      {
        icon: <ShieldCheck className="h-4 w-4 text-teal-500" />,
        title: "Kolaborasi Konsisten",
        description:
          "Pengingat dan log otomatis menjaga ritme tim tetap selaras sekaligus menyalakan semangat kolektif di setiap satker.",
      },
    ],
    []
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const trimmedUsername = username.trim();
    if (/\s/.test(trimmedUsername)) {
      setError("Username tidak boleh mengandung spasi");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""; // fall back to relative '/api'
      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.warn(
          "NEXT_PUBLIC_API_URL is not defined; defaulting to relative '/api'"
        );
      }
      const res = await fetch(`${apiUrl}/api/auth/dashboard-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password: password.trim() }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        const userId = data.user?.user_id || null;
        const userClient = data.user?.client_id || null;
        const userRole =
          data.user?.role ||
          data.user?.user_role ||
          data.user?.roleName ||
          null;
        setAuth(data.token, userClient, userId, userRole);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login gagal");
      }
    } catch (err) {
      setError(networkErrorMessage);
      handleNetworkFailure();
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Konfirmasi password tidak sesuai");
      setLoading(false);
      return;
    }

    const trimmedUsername = username.trim();
    if (/\s/.test(trimmedUsername)) {
      setError("Username tidak boleh mengandung spasi");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const trimmedRole = role.trim();
      const trimmedClientId = client_id.trim();
      const normalizedWhatsapp = normalizeWhatsapp(whatsapp);
      const res = await fetch(`${apiUrl}/api/auth/dashboard-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
          role: trimmedRole ? trimmedRole.toLowerCase() : undefined,
          client_id: trimmedClientId || undefined,
          whatsapp: normalizedWhatsapp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg =
          data.status === false
            ? "Registrasi berhasil, menunggu persetujuan admin"
            : "Registrasi berhasil, silakan login";
        setFormMode("login");
        setTimeout(() => setMessage(msg), 0);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRole("");
        setClientId("");
        setWhatsapp("");
      } else {
        setError(data.message || "Registrasi gagal");
      }
    } catch (err) {
      setError(networkErrorMessage);
      handleNetworkFailure();
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const trimmedUsername = forgotUsername.trim();
    const trimmedContact = recoveryContact.trim();
    const isEmail = trimmedContact.includes("@");
    const sanitizedContact = isEmail
      ? trimmedContact
      : trimmedContact.replace(/[\s()-]/g, "");
    if (!trimmedUsername || !sanitizedContact) {
      setError("Lengkapi username dan kontak pemulihan");
      setLoading(false);
      return;
    }

    const contact = isEmail
      ? sanitizedContact
      : normalizeWhatsapp(sanitizedContact);

    try {
      const response = await requestDashboardPasswordReset({
        username: trimmedUsername,
        contact,
      });
      if (response.success !== false) {
        const target = contact;
        setMessage(
          response.message ||
            `Instruksi reset dikirim ke ${target}. Silakan periksa pesan yang masuk.`,
        );
        setForgotUsername("");
        setRecoveryContact("");
      } else {
        setError(
          response.message ||
            "Gagal mengirim instruksi reset. Pastikan data yang dimasukkan benar.",
        );
      }
    } catch (err) {
      setError(networkErrorMessage);
      handleNetworkFailure();
    }

    setLoading(false);
  };

  const submitHandler =
    formMode === "register"
      ? handleRegister
      : formMode === "forgot"
        ? handleForgotPassword
        : handleLogin;

  const submitLabel = (() => {
    if (loading) {
      if (formMode === "register") return "Memproses registrasi...";
      if (formMode === "forgot") return "Mengirim instruksi reset...";
      return "Memverifikasi login...";
    }
    if (formMode === "register") return "Buat akun baru";
    if (formMode === "forgot") return "Kirim instruksi reset";
    return "Masuk sekarang";
  })();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#e9f3ff,_#cde9ff_58%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/40 blur-[160px]" />
        <div className="absolute -left-32 top-[18%] h-64 w-64 rounded-full bg-indigo-300/35 blur-[130px]" />
        <div className="absolute -right-20 bottom-[10%] h-72 w-72 rounded-full bg-teal-300/35 blur-[140px]" />
      </div>

      <div className="absolute top-4 right-4 z-30">
        <DarkModeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
          <section className="relative flex h-full flex-col justify-between gap-10 rounded-[32px] border border-sky-200/60 bg-white/40 p-8 text-slate-700 backdrop-blur-xl">
            <div className="space-y-7">
              <motion.span
                className="inline-flex items-center rounded-full border border-sky-200/60 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Cicero Operations Hub
              </motion.span>
              <motion.h1
                className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                Cicero — Kendali Terpadu, Data Akurat, Kinerja Selaras.
              </motion.h1>
              <motion.p
                className="max-w-xl text-balance text-sm leading-relaxed text-slate-700 md:text-base"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Cicero mengintegrasikan laporan, performa digital, dan koordinasi satker dalam satu sistem yang memastikan keputusan lebih cepat dan pelaksanaan lebih tertib.              </motion.p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {highlightItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-b from-white/70 via-white/50 to-transparent p-4 shadow-lg backdrop-blur-xl"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 * index }}
                >
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-semibold text-slate-700">
                    {item.icon}
                    {item.title}
                  </div>
                  <p className="text-sm text-slate-600">
                    {item.description}
                  </p>
                  <motion.div
                    className="absolute -bottom-24 -right-20 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl transition-transform duration-500 group-hover:translate-y-12"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </div>

          </section>

          <div className="relative flex flex-col gap-6">
            <motion.div
              className="absolute -right-6 -top-6 hidden h-32 w-32 rounded-full border border-sky-300/50 lg:block"
              animate={{ rotate: [0, 12, -8, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="relative z-20 rounded-[32px] border border-sky-200/60 bg-white/40 p-8 text-slate-700 shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-600/90">Cicero Access</p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {formMode === "register"
                      ? "Aktivasi Akun"
                      : formMode === "forgot"
                        ? "Reset Password"
                        : "Masuk Dashboard"}
                  </h2>
                </div>
                <div className="flex self-start rounded-full border border-sky-200/60 bg-white/60 p-1 text-xs font-medium sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setFormMode("login")}
                    className={`rounded-full px-3 py-1 transition ${
                      formMode === "login"
                        ? "bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("register")}
                    className={`rounded-full px-3 py-1 transition ${
                      formMode === "register"
                        ? "bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <p className="mb-7 rounded-2xl border border-sky-200/60 bg-white/50 p-4 text-xs text-slate-600">
                Masuk dengan akun role Anda. Kami menjaga data dengan protokol berlapis dan memastikan tim Anda selalu mendapat panduan terkini.
              </p>
              <form className="space-y-5" onSubmit={submitHandler}>
                {formMode !== "forgot" ? (
                  <>
                    <div>
                      <label htmlFor="username" className="sr-only">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        placeholder="Username dinas"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={handleTrim(setUsername)}
                        required
                        className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div className="relative">
                      <label htmlFor="password" className="sr-only">
                        Password
                      </label>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={handleTrim(setPassword)}
                        required
                        autoComplete={
                          formMode === "register"
                            ? "new-password"
                            : "current-password"
                        }
                        className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-500"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formMode === "login" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setFormMode("forgot")}
                          className="text-xs font-semibold text-sky-600 transition hover:text-sky-700"
                        >
                          Lupa password?
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="forgot_username" className="sr-only">
                        Username
                      </label>
                      <input
                        id="forgot_username"
                        type="text"
                        placeholder="Username yang terdaftar"
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        onBlur={handleTrim(setForgotUsername)}
                        required
                        className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="recovery_contact" className="sr-only">
                        Kontak pemulihan
                      </label>
                      <input
                        id="recovery_contact"
                        type="text"
                        placeholder="WhatsApp aktif atau email dinas"
                        value={recoveryContact}
                        onChange={(e) => setRecoveryContact(e.target.value)}
                        onBlur={handleTrim(setRecoveryContact)}
                        required
                        className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Kami akan mengirim tautan reset ke kontak resmi yang Anda daftarkan.
                    </p>
                  </>
                )}

                {formMode === "register" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <label htmlFor="confirm_password" className="sr-only">
                        Konfirmasi Password
                      </label>
                      <input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Konfirmasi Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={handleTrim(setConfirmPassword)}
                        required
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-500"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div>
                      <label htmlFor="whatsapp" className="sr-only">
                        Nomor WhatsApp
                      </label>
                      <input
                        id="whatsapp"
                        type="tel"
                        placeholder="Nomor WhatsApp aktif"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        onBlur={handleTrim(setWhatsapp)}
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="role" className="sr-only">
                          Role
                        </label>
                        <input
                          id="role"
                          type="text"
                          list="role-options"
                          placeholder="Role penugasan"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          onBlur={handleTrim(setRole)}
                          className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                        <datalist id="role-options">
                          <option value="OPERATOR" />
                          <option value="DITBINMAS" />
                          <option value="DITLANTAS" />
                          <option value="BIDHUMAS" />
                        </datalist>
                      </div>
                      <div>
                        <label htmlFor="client_id" className="sr-only">
                          Client ID
                        </label>
                        <input
                          id="client_id"
                          type="text"
                          list="client-options"
                          placeholder="Satker / Wilayah"
                          value={client_id}
                          onChange={(e) => setClientId(e.target.value)}
                          onBlur={handleTrim(setClientId)}
                          className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                        <datalist id="client-options">
                          <option value="DITBINMAS" />
                          <option value="DITLANTAS" />
                          <option value="DITSAMAPTA" />
                          <option value="BIDHUMAS" />
                          <option value="KEDIRI" />
                          <option value="BANGKALAN" />
                          <option value="BANYUWANGI" />
                          <option value="BATU" />
                          <option value="BLITAR" />
                          <option value="BLITAR KOTA" />
                          <option value="BOJONEGORO" />
                          <option value="BONDOWOSO" />
                          <option value="GRESIK" />
                          <option value="JEMBER" />
                          <option value="JOMBANG" />
                          <option value="KEDIRI KOTA" />
                          <option value="KP3 TANJUNG PERAK" />
                          <option value="LAMONGAN" />
                          <option value="LUMAJANG" />
                          <option value="MADIUN" />
                          <option value="MADIUN KOTA" />
                          <option value="MAGETAN" />
                          <option value="MALANG" />
                          <option value="MALANG KOTA" />
                          <option value="MOJOKERTO" />
                          <option value="MOJOKERTO KOTA" />
                          <option value="NGANJUK" />
                          <option value="NGAWI" />
                          <option value="PACITAN" />
                          <option value="PAMEKASAN" />
                          <option value="PASURUAN" />
                          <option value="PASURUAN KOTA" />
                          <option value="PONOROGO" />
                          <option value="PROBOLINGGO" />
                          <option value="PROBOLINGGO KOTA" />
                          <option value="SAMPANG" />
                          <option value="SIDOARJO" />
                          <option value="SITUBONDO" />
                          <option value="SUMENEP" />
                          <option value="SURABAYA" />
                          <option value="TRENGGALEK" />
                          <option value="TUBAN" />
                          <option value="TULUNGAGUNG" />
                        </datalist>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-400/40 bg-red-100 px-4 py-3 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-xl border border-emerald-400/50 bg-emerald-100 px-4 py-3 text-center text-sm text-emerald-600">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-2xl border border-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-transparent ${
                    loading ? "opacity-60" : "hover:shadow-xl hover:shadow-sky-200/60"
                  }`}
                >
                  {submitLabel}
                </button>

                <p className="text-center text-[0.7rem] text-slate-500">
                  Dengan masuk, Anda menyetujui protokol keamanan Cicero dan penggunaan data sesuai kebijakan internal.
                </p>

                {formMode === "forgot" && (
                  <div className="text-center text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setFormMode("login")}
                      className="font-semibold text-sky-600 transition hover:text-sky-700"
                    >
                      Kembali ke halaman login
                    </button>
                  </div>
                )}
              </form>
            </motion.div>

            <motion.div
              className="relative z-10 flex items-start gap-4 rounded-[28px] border border-sky-200/60 bg-white/50 p-6 text-slate-700 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 via-cyan-200 to-indigo-200 text-sky-600">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600/90">Onboarding Terarah</p>
                <h3 className="text-lg font-semibold text-slate-800">Verifikasi akses dalam 1×24 jam</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Tim Cicero akan menyapa lewat WhatsApp untuk memvalidasi mandat, memastikan akses diberikan secara tepat dan konsisten bagi seluruh tim.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="absolute inset-x-6 top-6 -z-10 h-[92%] rounded-[36px] bg-gradient-to-br from-white/60 via-white/30 to-transparent blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
