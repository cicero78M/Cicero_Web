"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !clientId) {
      router.replace("/");
    }
  }, [router]);
}
