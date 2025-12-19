"use client";

import useRequireReposterAuth from "@/hooks/useRequireReposterAuth";
import ReposterMenu from "./ReposterMenu";

type ReposterShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function ReposterShell({
  title,
  description,
  children,
}: ReposterShellProps) {
  useRequireReposterAuth();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-slate-50 px-4 py-6 text-slate-700 dark:bg-slate-950 dark:text-slate-100 md:px-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Reposter
        </p>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-300">
            {description}
          </p>
        </div>
        <ReposterMenu />
      </div>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/70">
        {children}
      </div>
    </div>
  );
}
