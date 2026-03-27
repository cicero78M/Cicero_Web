"use client";

import Link from "next/link";
import { Command } from "lucide-react";
import FooterSupportSection from "@/components/landing/FooterSupportSection";
import HeroSection from "@/components/landing/HeroSection";
import SecondaryPathsSection from "@/components/landing/SecondaryPathsSection";
import TrustSection from "@/components/landing/TrustSection";
import UseCaseSection from "@/components/landing/UseCaseSection";
import ValueSection from "@/components/landing/ValueSection";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import {
  footerContent,
  headerLinks,
  heroContent,
  primaryCta,
  secondaryHeroCtas,
  secondaryPaths,
  trustAssets,
  useCases,
  valueMessages,
} from "@/lib/landingPageContent";

export default function LandingPage() {
  useAuthRedirect();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.3),_transparent_48%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_32%)]" />

        <header className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-sky-100">
                <Command className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Cicero</p>
                <p className="text-sm text-slate-600">Portal evaluasi publik dan akses operasional</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-3">
              {headerLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>
          <HeroSection content={heroContent} primaryCta={primaryCta} secondaryCtas={secondaryHeroCtas} />
          <ValueSection items={valueMessages} />
          <UseCaseSection items={useCases} />
          <TrustSection items={trustAssets} />
          <SecondaryPathsSection items={secondaryPaths} />
        </main>

        <FooterSupportSection content={footerContent} />
      </div>
    </div>
  );
}
