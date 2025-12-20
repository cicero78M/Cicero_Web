"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  getReposterReportLinks,
  REPOSTER_REPORTED_POSTS_KEY,
  ReportLinkItem,
} from "@/utils/api";

const PLATFORM_ORDER = [
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
  "youtube",
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  youtube: "YouTube",
};

function readReportedPostIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(REPOSTER_REPORTED_POSTS_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((entry) => typeof entry === "string"));
    }
  } catch {
    const fallback = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    return new Set(fallback);
  }
  return new Set();
}

function writeReportedPostIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    REPOSTER_REPORTED_POSTS_KEY,
    JSON.stringify(Array.from(ids)),
  );
}

export default function ReportLinksClient() {
  const { token, isHydrating } = useReposterAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = useMemo(() => {
    if (!params?.postId) return "";
    return Array.isArray(params.postId) ? params.postId[0] : params.postId;
  }, [params]);
  const clientId = searchParams.get("client_id") ?? "";
  const sourcePlatform = searchParams.get("platform") ?? "";

  const [links, setLinks] = useState<ReportLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const reportedSet = readReportedPostIds();
    setReported(reportedSet.has(postId));
  }, [postId]);

  useEffect(() => {
    if (isHydrating) return;
    if (!token) {
      setError("Token reposter belum tersedia.");
      setLoading(false);
      return;
    }
    if (!postId || !clientId) {
      setError("Post ID atau Client ID belum tersedia.");
      setLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getReposterReportLinks(
      token,
      { postId, clientId, platform: sourcePlatform },
      controller.signal,
    )
      .then((items) => {
        if (!isActive) return;
        setLinks(items);
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
        setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [clientId, isHydrating, postId, sourcePlatform, token]);

  const normalizedLinks = useMemo(() => {
    const map = new Map(
      links.map((item) => [item.platform.toLowerCase(), item.url]),
    );
    return PLATFORM_ORDER.map((platform) => ({
      platform,
      label: PLATFORM_LABELS[platform] || platform,
      url: map.get(platform) || "",
    }));
  }, [links]);

  const handleMarkReported = () => {
    if (!postId) return;
    const reportedSet = readReportedPostIds();
    reportedSet.add(postId);
    writeReportedPostIds(reportedSet);
    setReported(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Informasi tugas
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-white">
              Post ID
            </span>
            : {postId || "-"}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-white">
              Client ID
            </span>
            : {clientId || "-"}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-white">
              Platform sumber
            </span>
            : {sourcePlatform || "Instagram"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          Memuat tautan laporan...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 md:grid-cols-2">
          {normalizedLinks.map((item) => (
            <div
              key={item.platform}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {item.label}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {item.url || "Link laporan belum tersedia."}
                </p>
              </div>
              {item.url ? (
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:underline dark:text-cyan-300"
                >
                  Buka laporan
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            Status laporan
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {reported
              ? "Sudah dilaporkan di semua platform."
              : "Belum ditandai sebagai laporan selesai."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkReported}
          disabled={reported}
          className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {reported ? "Sudah dilaporkan" : "Tandai sudah dilaporkan"}
        </button>
      </div>
    </div>
  );
}
