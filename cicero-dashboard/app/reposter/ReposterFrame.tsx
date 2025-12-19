"use client";

import Link from "next/link";
import useRequireReposterAuth from "@/hooks/useRequireReposterAuth";
import { buildReposterUrl, getReposterBaseUrl } from "./reposterUrl";

type ReposterFrameProps = {
  title: string;
  description: string;
  path?: string;
  iframeTitle?: string;
  children?: React.ReactNode;
};

export default function ReposterFrame({
  title,
  description,
  path,
  iframeTitle = "Reposter",
  children,
}: ReposterFrameProps) {
  useRequireReposterAuth();
  const baseUrl = getReposterBaseUrl();
  const iframeUrl = buildReposterUrl(path);
  const showBaseLink = path && path !== "/";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 bg-slate-50 px-4 py-6 text-slate-700 dark:bg-slate-950 dark:text-slate-100 md:px-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Reposter
        </p>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
          {title}
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-300">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-sky-600 dark:text-cyan-300">
          <Link
            href={iframeUrl}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            Buka halaman ini di tab baru
          </Link>
          {showBaseLink ? (
            <Link
              href={baseUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Buka beranda reposter
            </Link>
          ) : null}
        </div>
        {children}
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/70">
        <iframe
          title={iframeTitle}
          src={iframeUrl}
          className="h-[calc(100vh-14rem)] w-full"
          allow="clipboard-read; clipboard-write;"
        />
      </div>
    </div>
  );
}
