"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getInstagramBasicAccessToken } from "@/utils/api";

export default function InstagramBasicCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setError("Code not found");
      setLoading(false);
      return;
    }
    async function fetchToken() {
      try {
        const token = await getInstagramBasicAccessToken(code);
        if (typeof window !== "undefined") {
          localStorage.setItem("ig_basic_token", token);
        }
        router.replace("/instagram-basic");
      } catch (err) {
        setError("Gagal mengambil token");
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, [params, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">Loading...</main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </main>
    );
  }
  return null;
}
