// hooks/useAuthRedirect.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Ganti dengan cek autentikasi sesuai implementasimu (misal cek token di localStorage/cookie)
    const isLoggedIn = !!localStorage.getItem("token"); // atau cek cookie
    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [router]);
}
