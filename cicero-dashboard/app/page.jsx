"use client";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-black flex items-center justify-center"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        minHeight: "100dvh",
      }}
    >
      <div className="w-full max-w-md sm:max-w-xl flex flex-col items-center justify-center gap-8 p-4 sm:p-8 rounded-2xl bg-black/10 shadow-xl">
        {/* Logo */}
        <div className="w-full flex justify-center">
          <Image
            src="/CICERO.png"
            alt="CICERO Logo"
            width={300}
            height={128}
            priority
            className="drop-shadow-2xl select-none"
            style={{
              width: "clamp(160px, 60%, 320px)",
              height: "auto",
              marginBottom: "1.5rem",
              objectFit: "contain",
            }}
          />
        </div>
        <div className="text-center w-full flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-100 tracking-tight">
            CICERO
          </h1>
          <div className="text-base sm:text-lg md:text-xl text-blue-300 font-mono tracking-wide">
            "Solus Sed Invictus"
          </div>
          <p className="text-gray-300 mt-2 text-sm sm:text-base md:text-lg">
            Next-Gen Dashboard for Social Media Monitoring &amp; Team Management
          </p>
        </div>
        <Link
          href="/login"
          className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 transition-all text-white text-base sm:text-lg md:text-xl font-semibold px-8 py-3 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          Masuk ke Dashboard
        </Link>
      </div>
    </div>
  );
}
