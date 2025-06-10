// hooks/useAuthRedirect.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check the token stored by the login page
    const isLoggedIn = !!localStorage.getItem("cicero_token");
    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [router]);
}
