"use client";

import useAuthRedirect from "@/hooks/useAuthRedirect";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function LoginPage() {
  useAuthRedirect(); // Akan redirect ke /dashboard jika sudah login
  const { setAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [client_id, setClientId] = useState("");
  const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

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
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        const userId = data.user?.user_id || null;
        const userClient = data.user?.client_id || null;
        setAuth(data.token, userClient, userId);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login gagal");
      }
    } catch (err) {
      setError("Gagal koneksi ke server");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/auth/dashboard-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role: role ? role.toLowerCase() : undefined,
          client_id: client_id || undefined,
          whatsapp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.status === false
          ? "Registrasi berhasil, menunggu persetujuan admin"
          : "Registrasi berhasil, silakan login";
        setMessage(msg);
        setIsRegister(false);
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
      setError("Gagal koneksi ke server");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <form
        onSubmit={isRegister ? handleRegister : handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm"
      >
        <h2 className="mb-6 text-2xl font-bold text-blue-600 text-center">
          {isRegister ? "Register" : "Login"} Cicero
        </h2>
        <div className="mb-4">
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4 relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {isRegister && (
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
                required
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div>
              <label htmlFor="whatsapp" className="sr-only">
                Nomor WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                placeholder="Nomor WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                inputMode="tel"
                autoComplete="tel"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <input
                id="role"
                type="text"
                list="role-options"
                placeholder="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
              />
              <datalist id="role-options">
                <option value="OPERATOR" />
                <option value="DITBINMAS" />
                <option value="DITLANTAS" />
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
                placeholder="Client ID"
                value={client_id}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
              />
              <datalist id="client-options">
                <option value="DITBINMAS" />
                <option value="DITLANTAS" />
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
        )}
        {error && (
          <div className="text-red-600 text-sm mb-2 text-center">{error}</div>
        )}
        {message && (
          <div className="text-green-600 text-sm mb-2 text-center">{message}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold text-lg transition
            ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
          `}
        >
          {loading ? (isRegister ? "Registering..." : "Logging in...") : isRegister ? "Register" : "Login"}
        </button>
        <div className="text-sm text-center mt-4">
          {isRegister ? (
            <button type="button" onClick={() => setIsRegister(false)} className="text-blue-600 hover:underline">
              Sudah punya akun? Login
            </button>
          ) : (
            <button type="button" onClick={() => setIsRegister(true)} className="text-blue-600 hover:underline">
              Belum punya akun? Register
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
