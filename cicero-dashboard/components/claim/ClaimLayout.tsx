import { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type AccentKey = "trust" | "consistency" | "spirit";

type ClaimLayoutProps = {
  stepLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  infoTitle?: string;
  infoDescription?: string;
  infoHighlights?: string[];
  infoFooter?: ReactNode;
  illustration?: ReactNode;
  cardAccent?: AccentKey;
};

const accentStyles: Record<AccentKey, { border: string; stepText: string; badge: string }> = {
  trust: {
    border: "border-slate-200 shadow-xl shadow-slate-200/50",
    stepText: "text-indigo-600",
    badge: "bg-indigo-600 text-white",
  },
  consistency: {
    border: "border-slate-200 shadow-xl shadow-slate-200/50",
    stepText: "text-indigo-600",
    badge: "bg-indigo-600 text-white",
  },
  spirit: {
    border: "border-slate-200 shadow-xl shadow-slate-200/50",
    stepText: "text-indigo-600",
    badge: "bg-indigo-600 text-white",
  },
};

const defaultHighlights = [
  "Data kamu aman dengan proses verifikasi bertahap.",
  "Kami memastikan setiap langkah mudah diikuti.",
  "Tim kami siap membantu bila kamu membutuhkan dukungan.",
];

export default function ClaimLayout({
  stepLabel,
  title,
  description,
  children,
  icon,
  infoTitle = "Verifikasi data yang penuh kepercayaan",
  infoDescription = "Kami menggunakan pendekatan bertahap untuk menjaga keamanan akun dan memastikan hanya kamu yang dapat mengelola data pribadi.",
  infoHighlights = defaultHighlights,
  infoFooter,
  illustration,
  cardAccent = "trust",
}: ClaimLayoutProps) {
  const accent = accentStyles[cardAccent];

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-8 text-slate-950 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between">
        <a href="https://papiqo.com" className="flex items-center gap-3" aria-label="Kembali ke Papiqo">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Image src="/cicero-mark.png" alt="Logo Cicero" fill sizes="40px" className="object-contain p-1" priority />
          </span>
          <span><span className="block text-sm font-bold tracking-[0.18em]">CICERO</span><span className="block text-[11px] text-slate-500">Claim workspace</span></span>
        </a>
        <a href="https://papiqo.com" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-700">Kembali ke beranda</a>
      </div>
      <div className="mx-auto grid max-w-7xl items-stretch overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[.9fr_1.1fr]">
        <aside className="relative overflow-hidden bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
          <div className="relative z-10 flex h-full flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-indigo-300">
              Aman dan terverifikasi
            </div>
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">{infoTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                {infoDescription}
              </p>
            </div>
            <ul className="space-y-4 text-sm text-slate-300">
              {infoHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-indigo-400" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            {illustration && <div className="mt-auto">{illustration}</div>}
            {infoFooter && <div className="text-sm text-slate-400">{infoFooter}</div>}
          </div>
        </aside>

        <section className="flex w-full items-stretch bg-white">
          <div className="w-full">
            <div
              className={cn(
                "h-full border-0 bg-white p-7 sm:p-10 lg:p-12",
                accent.border,
              )}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl shadow-sm",
                        accent.badge,
                      )}
                    >
                      {icon ?? (
                        <span className="text-lg font-semibold">{stepLabel.charAt(0)}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.3em]",
                        accent.stepText,
                      )}
                    >
                      {stepLabel}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">{title}</h1>
                    {description && (
                      <p className="text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">{children}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
