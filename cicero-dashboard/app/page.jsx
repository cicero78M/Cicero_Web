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
      <div
        className={`
          max-w-2xl w-full mx-auto flex flex-col items-center
          gap-1 md:gap-1 p-6 md:p-8

        `}
        // gap-14 di desktop, gap-10 di mobile
      >
        {/* Logo */}
        <div className="w-full flex justify-center">
          <Image
            src="/CICERO.png"
            alt="CICERO Logo"
            width={420}
            height={180}
            priority
            className="drop-shadow-2xl select-none"
            style={{ maxWidth: "90%", height: "auto" }}
          />
        </div>
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100 tracking-tight mb-2">
            CICERO
          </h1>
          <div className="text-lg md:text-xl text-blue-300 font-mono mb-2 tracking-wide">
            "Solus Sed Invictus"
          </div>
          <p className="text-gray-300 mt-3 text-md md:text-lg">
            Next-Gen Dashboard for Social Media Monitoring & Team Management
          </p>
        </div>
        {/* Tombol selalu kelihatan */}
        <Link
          href="/login"
          className="
            mt-2 md:mt-2
            inline-block bg-blue-600 hover:bg-blue-700 transition-all text-white text-lg md:text-xl font-semibold px-8 py-3 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400
          "
        >
          Masuk ke Dashboard
        </Link>
      </div>
    </div>
  );
}
