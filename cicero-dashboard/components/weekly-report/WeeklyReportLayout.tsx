"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WeeklyReportLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function WeeklyReportLayout({
  children,
  className,
}: WeeklyReportLayoutProps) {
  return (
    <main
      className={cn(
        "relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-slate-800",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute -right-12 bottom-12 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute inset-x-16 bottom-10 h-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(224,242,254,0.45),_rgba(255,255,255,0))] blur-2xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        {children}
      </div>
    </main>
  );
}
