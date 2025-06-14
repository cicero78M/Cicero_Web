"use client";
import { useState } from "react";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, ShieldCheck, Users, CheckCircle } from "lucide-react";

export default function LandingPage() {
  useAuthRedirect();
  const [email, setEmail] = useState("");

  const packages = [
    {
      name: "Kelas A",
      users: "1500-3000 pengguna",
      setup: "Rp5.000.000",
      monthly: "Rp4.200.000",
      features: [
        "Analisis real-time",
        "Kolaborasi tim penuh",
        "Prioritas dukungan",
        "Integrasi kustom",
      ],
    },
    {
      name: "Kelas B",
      users: "800-1500 pengguna",
      setup: "Rp4.000.000",
      monthly: "Rp3.600.000",
      popular: true,
      features: [
        "Analisis real-time",
        "Kolaborasi tim",
        "Dukungan standar",
        "Integrasi dasar",
      ],
    },
    {
      name: "Kelas C",
      users: "maks. 800 pengguna",
      setup: "Rp3.000.000",
      monthly: "Rp2.400.000",
      features: [
        "Analisis dasar",
        "Kolaborasi tim",
        "Dukungan email",
        "1 akun sosial",
      ],
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Terima kasih!");
    setEmail("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black text-gray-100">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-4 bg-black/70 backdrop-blur-md sticky top-0 z-10">
        <Image src="/CICERO.png" alt="CICERO Logo" width={120} height={40} priority className="h-10 w-auto" />
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow">
          Login
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center text-center px-6 pt-16 pb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Manage Social Media Effortlessly</h1>
        <p className="text-blue-200 mb-8 max-w-2xl">Next-Gen Dashboard for Social Media Monitoring &amp; Team Management</p>
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-lg">
          Get Started
        </Link>

        {/* Features */}
        <section className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl w-full">
          <div className="flex flex-col items-center bg-white/5 p-6 rounded-xl">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <h3 className="mt-4 font-semibold text-lg">Analytics in Real Time</h3>
            <p className="mt-2 text-sm text-blue-100 text-center">Monitor engagement and performance across platforms instantly.</p>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-6 rounded-xl">
            <Users className="h-8 w-8 text-blue-400" />
            <h3 className="mt-4 font-semibold text-lg">Team Collaboration</h3>
            <p className="mt-2 text-sm text-blue-100 text-center">Coordinate tasks and manage your team from a single dashboard.</p>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-6 rounded-xl">
            <ShieldCheck className="h-8 w-8 text-blue-400" />
            <h3 className="mt-4 font-semibold text-lg">Secure Data</h3>
            <p className="mt-2 text-sm text-blue-100 text-center">Your analytics are protected with enterprise-grade security.</p>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mt-16 w-full max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Paket Cicero</h2>
          <p className="text-blue-100 mb-8 text-center">
            Optimalkan pengelolaan media sosial Anda bersama Cicero dengan paket yang sesuai skala tim. Dapatkan potongan 10% untuk komitmen jangka menengah maupun jangka panjang.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative flex flex-col bg-white text-gray-900 rounded-xl shadow-lg p-6 ${pkg.popular ? "ring-2 ring-blue-600" : ""}`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{pkg.users}</p>
                <p className="text-sm text-gray-500">Biaya Setup</p>
                <p className="text-3xl font-extrabold">{pkg.setup}</p>
                <p className="mt-4 text-sm text-gray-500">Biaya Bulanan</p>
                <p className="text-2xl font-semibold">{pkg.monthly} </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle aria-hidden="true" className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Daftar paket ${pkg.name}`}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Daftar Sekarang
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="mt-16 max-w-2xl">
          <blockquote className="italic text-blue-100">"Cicero drastically improved our social engagement in just weeks."</blockquote>
          <p className="mt-2 text-sm text-blue-200">- Marketing Manager, Cicero Devs</p>
        </section>

        {/* Signup Form */}
        <section className="mt-16 w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white/5 p-6 rounded-xl">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Anda"
              required
              className="px-3 py-2 rounded-md border border-gray-300 text-black"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold">
              Dapatkan Update
            </button>
            <p className="text-xs text-blue-100 text-center">Kami tidak akan membagikan email Anda.</p>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center py-4 text-sm">
        <p>&copy; {new Date().getFullYear()} Cicero</p>
      </footer>
    </div>
  );
}
