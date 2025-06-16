// hooks/useAuthRedirect.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function useAuthRedirect() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    // Check the token stored by the login page
    if (token) {
      router.replace("/dashboard");
    }
  }, [router, token]);
}
