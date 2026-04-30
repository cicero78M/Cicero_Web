"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTelegramWidgetConfig,
  loginAdminWithTelegramWidget,
  setAdminSystemToken,
} from "@/utils/adminSystemApi";

export default function AdminSystemLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Silakan login memakai Telegram widget.");

  const [botUsername, setBotUsername] = useState("");

  useEffect(() => {
    let mounted = true;

    async function initWidget() {
      try {
        const cfg = await getTelegramWidgetConfig();
        const username = String(cfg?.data?.bot_username || "").trim();
        if (!username) throw new Error("Username bot Telegram tidak ditemukan");
        if (!mounted) return;
        setBotUsername(username);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat konfigurasi Telegram widget");
      }
    }

    initWidget();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!botUsername) return;

    const callbackName = "onTelegramAdminAuth";
    window[callbackName] = async (user) => {
      setError("");
      setMessage("Memverifikasi login Telegram...");
      try {
        const data = await loginAdminWithTelegramWidget(user || {});
        if (!data?.token) throw new Error("Token admin tidak diterima");
        setAdminSystemToken(data.token);
        router.replace("/admin-system");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login Telegram gagal");
        setMessage("");
      }
    };

    const widgetContainer = document.getElementById("telegram-widget-container");
    if (!widgetContainer) return;
    widgetContainer.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    widgetContainer.appendChild(script);

    return () => {
      delete window[callbackName];
    };
  }, [botUsername, router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Admin System Login</h1>
          <p className="text-sm text-slate-400 mt-1">
            Akses hanya untuk akun Telegram <b>@Cicero_Papiqo</b> via Telegram Login Widget.
          </p>
        </div>

        <div id="telegram-widget-container" className="flex justify-center py-2" />

        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>
    </main>
  );
}
