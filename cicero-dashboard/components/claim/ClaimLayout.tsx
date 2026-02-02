import { ReactNode } from "react";
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
    border: "border-trust-200 shadow-[0_25px_50px_-25px_rgba(58,182,192,0.6)]",
    stepText: "text-trust-600",
    badge: "bg-trust-50 text-trust-600 ring-2 ring-trust-100/60",
  },
  consistency: {
    border: "border-consistency-200 shadow-[0_25px_50px_-25px_rgba(140,101,232,0.55)]",
    stepText: "text-consistency-600",
    badge: "bg-consistency-50 text-consistency-600 ring-2 ring-consistency-100/60",
  },
  spirit: {
    border: "border-spirit-200 shadow-[0_25px_50px_-25px_rgba(255,111,138,0.55)]",
    stepText: "text-spirit-600",
    badge: "bg-spirit-50 text-spirit-600 ring-2 ring-spirit-100/60",
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
    <main className="min-h-screen bg-gradient-to-br from-trust-50 via-consistency-50 to-spirit-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_minmax(0,1fr)]">
        <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 via-trust-50/90 to-consistency-50/80 p-8 text-neutral-navy shadow-xl ring-1 ring-white/50">
          <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-trust-200/40 blur-3xl" aria-hidden />
          <div className="absolute -right-10 -bottom-24 h-52 w-52 rounded-full bg-spirit-200/40 blur-3xl" aria-hidden />
          <div className="relative z-10 flex h-full flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-consistency-400 ring-1 ring-white/50">
              Aman & Terpercaya
            </div>
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">{infoTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-slate sm:text-base">
                {infoDescription}
              </p>
            </div>
            <ul className="space-y-3 text-sm text-neutral-slate">
              {infoHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gradient-to-br from-trust-300 via-consistency-300 to-spirit-300" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            {illustration && <div className="mt-auto">{illustration}</div>}
            {infoFooter && <div className="text-sm text-neutral-slate/80">{infoFooter}</div>}
          </div>
        </aside>

        <section className="flex w-full items-stretch">
          <div className="w-full">
            <div
              className={cn(
                "h-full rounded-3xl border bg-white/90 p-8 backdrop-blur-sm sm:p-10",
                accent.border,
              )}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full shadow-sm",
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
                    <h1 className="text-2xl font-semibold text-neutral-navy sm:text-3xl">{title}</h1>
                    {description && (
                      <p className="text-sm text-neutral-slate sm:text-base">{description}</p>
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
