"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  getReposterReportLinks,
  getReposterReportLinkDuplicates,
  REPOSTER_REPORTED_POSTS_KEY,
  submitReposterReportLinks,
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

const REPORT_LINK_CACHE_KEY = "reposter_report_links_cache";
const REPORT_LINK_HISTORY_KEY = "reposter_report_links_history";

const PLATFORM_VALIDATORS: Record<string, (value: string) => boolean> = {
  instagram: (value) =>
    value.includes("instagram.com") ||
    value.includes("instagr.am") ||
    value.includes("ig.me"),
  facebook: (value) =>
    value.includes("facebook.com") || value.includes("fb.watch"),
  twitter: (value) => value.includes("twitter.com") || value.includes("x.com"),
  tiktok: (value) => value.includes("tiktok.com"),
  youtube: (value) =>
    value.includes("youtube.com") || value.includes("youtu.be"),
};

const PLATFORM_REQUIRED = new Set(["instagram", "facebook", "twitter"]);

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
  const { token, profile } = useReposterAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = useMemo(() => {
    if (!params?.postId) return "";
    return Array.isArray(params.postId) ? params.postId[0] : params.postId;
  }, [params]);
  const clientId = searchParams.get("client_id") ?? "";
  const sourcePlatform = searchParams.get("platform") ?? "";
  const taskNumber = searchParams.get("task_number") ?? "";

  const [draftLinks, setDraftLinks] = useState<Record<string, string>>({});
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [draftSuccess, setDraftSuccess] = useState("");
  const [reportLinksLoading, setReportLinksLoading] = useState(false);
  const [reportLinksError, setReportLinksError] = useState("");
  const [reportLinksNotice, setReportLinksNotice] = useState("");
  const [reportLinks, setReportLinks] = useState<
    Array<{ platform: string; url: string }>
  >([]);

  const profileShortcode = useMemo(
    () =>
      profile?.shortcode ||
      profile?.lastShortcode ||
      profile?.last_shortcode ||
      "",
    [profile?.lastShortcode, profile?.last_shortcode, profile?.shortcode],
  );

  const draftEntries = useMemo(
    () =>
      PLATFORM_ORDER.map((platform) => ({
        platform,
        label: PLATFORM_LABELS[platform] || platform,
        required: PLATFORM_REQUIRED.has(platform),
        value: draftLinks[platform] ?? "",
      })),
    [draftLinks],
  );

  const userKey = useMemo(
    () => profile?.userId || profile?.id || "anon",
    [profile?.id, profile?.userId],
  );

  const reportUserId = useMemo(
    () =>
      profile?.userId ||
      profile?.id ||
      profile?.nrp ||
      profile?.user_id ||
      "",
    [profile?.id, profile?.nrp, profile?.userId, profile?.user_id],
  );

  const normalizeLink = (value: string) => value.trim().toLowerCase();

  const isValidLink = (platform: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (!trimmed.startsWith("http")) return false;
    const validator = PLATFORM_VALIDATORS[platform];
    if (!validator) return false;
    try {
      const url = new URL(trimmed);
      return validator(url.host.toLowerCase());
    } catch {
      return false;
    }
  };

  const detectPlatform = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const url = new URL(trimmed);
      const host = url.host.toLowerCase();
      return PLATFORM_ORDER.find((platform) =>
        PLATFORM_VALIDATORS[platform]?.(host),
      );
    } catch {
      return null;
    }
  };

  const isLikelyShortcode = (value: string) => {
    if (!value) return false;
    if (!/^[A-Za-z0-9_-]{5,20}$/.test(value)) return false;
    return /[A-Za-z]/.test(value);
  };

  const extractInstagramShortcode = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/(p|reel|reels|tv)\/([^/?#]+)/i);
      return match?.[2] ?? "";
    } catch {
      return "";
    }
  };

  const reportShortcode = useMemo(() => {
    if (isLikelyShortcode(postId)) return postId;
    const draftShortcode = extractInstagramShortcode(
      draftLinks.instagram ?? "",
    );
    if (draftShortcode) return draftShortcode;
    return profileShortcode || "";
  }, [draftLinks.instagram, postId, profileShortcode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached: Record<string, string> = {};
    const raw = window.localStorage.getItem(REPORT_LINK_CACHE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          PLATFORM_ORDER.forEach((platform) => {
            const key = `${userKey}_${platform}`;
            const value = parsed[key];
            if (typeof value === "string") {
              cached[platform] = value;
            }
          });
        }
      } catch {
        // ignore malformed cache
      }
    }
    setDraftLinks((prev) => ({ ...cached, ...prev }));
  }, [userKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clipboard = navigator.clipboard;
    if (!clipboard?.readText) return;
    clipboard
      .readText()
      .then((text) => {
        const platform = detectPlatform(text);
        if (platform && !draftLinks[platform]) {
          setDraftLinks((prev) => ({
            ...prev,
            [platform]: text.trim(),
          }));
        }
      })
      .catch(() => undefined);
  }, [draftLinks]);

  useEffect(() => {
    if (!token) return;
    setReportLinksError("");
    setReportLinksNotice("");
    setReportLinksLoading(false);
    if (!reportUserId) {
      setReportLinksError("User ID belum tersedia.");
      return;
    }
    if (!reportShortcode) {
      setReportLinksNotice(
        "Masukkan link Instagram untuk memuat tautan laporan sebelumnya.",
      );
      return;
    }
    const controller = new AbortController();
    setReportLinksLoading(true);
    getReposterReportLinks(
      token,
      {
        shortcode: reportShortcode,
        userId: reportUserId,
      },
      controller.signal,
    )
      .then((links) => {
        setReportLinks(links);
        if (links.length === 0) {
          setReportLinksNotice("Belum ada tautan laporan yang tercatat.");
          return;
        }
        const mapped: Record<string, string> = {};
        links.forEach((link) => {
          const platformKey = link.platform?.toLowerCase();
          if (platformKey && !mapped[platformKey]) {
            mapped[platformKey] = link.url;
          }
        });
        setDraftLinks((prev) => {
          const next = { ...prev };
          Object.entries(mapped).forEach(([platform, url]) => {
            if (!next[platform]) {
              next[platform] = url;
            }
          });
          return next;
        });
        persistCache(mapped);
        const normalizedMapped = Object.entries(mapped).reduce(
          (acc, [platform, url]) => {
            if (url) {
              acc[platform] = normalizeLink(url);
            }
            return acc;
          },
          {} as Record<string, string>,
        );
        persistHistory(normalizedMapped);
        setReportLinksNotice("Tautan laporan sebelumnya sudah tercatat.");
      })
      .catch((err) => {
        setReportLinksError(
          err instanceof Error ? err.message : "Gagal memuat tautan laporan.",
        );
      })
      .finally(() => {
        setReportLinksLoading(false);
      });
    return () => controller.abort();
  }, [postId, reportShortcode, reportUserId, token]);

  const handleDraftChange = (platform: string, value: string) => {
    setDraftError("");
    setDraftSuccess("");
    setDraftLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const persistCache = (nextLinks: Record<string, string>) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(REPORT_LINK_CACHE_KEY);
    let cache: Record<string, string> = {};
    if (raw) {
      try {
        cache = JSON.parse(raw);
      } catch {
        cache = {};
      }
    }
    PLATFORM_ORDER.forEach((platform) => {
      const entry = nextLinks[platform];
      if (entry) {
        cache[`${userKey}_${platform}`] = entry;
      }
    });
    window.localStorage.setItem(
      REPORT_LINK_CACHE_KEY,
      JSON.stringify(cache),
    );
  };

  const loadHistory = () => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(REPORT_LINK_HISTORY_KEY);
    const history: Record<string, Set<string>> = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          PLATFORM_ORDER.forEach((platform) => {
            const key = `${userKey}_${platform}`;
            const value = parsed[key];
            if (Array.isArray(value)) {
              history[platform] = new Set(
                value.filter((entry) => typeof entry === "string"),
              );
            }
          });
        }
      } catch {
        // ignore malformed cache
      }
    }
    return history;
  };

  const persistHistory = (nextLinks: Record<string, string>) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(REPORT_LINK_HISTORY_KEY);
    let cache: Record<string, string[]> = {};
    if (raw) {
      try {
        cache = JSON.parse(raw);
      } catch {
        cache = {};
      }
    }
    PLATFORM_ORDER.forEach((platform) => {
      const entry = nextLinks[platform];
      if (entry) {
        const key = `${userKey}_${platform}`;
        const current = new Set(cache[key] ?? []);
        current.add(entry);
        cache[key] = Array.from(current);
      }
    });
    window.localStorage.setItem(
      REPORT_LINK_HISTORY_KEY,
      JSON.stringify(cache),
    );
  };

  const handleSubmitReport = async () => {
    setDraftError("");
    setDraftSuccess("");
    if (!token) {
      setDraftError("Token reposter belum tersedia.");
      return;
    }
    const sanitized: Record<string, string> = {};
    PLATFORM_ORDER.forEach((platform) => {
      const value = draftLinks[platform]?.trim() ?? "";
      if (value) {
        sanitized[platform] = value;
      }
    });

    const missingRequired = Array.from(PLATFORM_REQUIRED).filter(
      (platform) => !sanitized[platform],
    );
    if (missingRequired.length > 0) {
      setDraftError(
        "Lengkapi link Instagram, Facebook, dan Twitter terlebih dahulu.",
      );
      return;
    }

    const invalidPlatforms = PLATFORM_ORDER.filter((platform) => {
      const value = sanitized[platform];
      if (!value) return false;
      return !isValidLink(platform, value);
    });
    if (invalidPlatforms.length > 0) {
      setDraftError("Periksa kembali format link yang diisi.");
      return;
    }

    const normalizedValues = PLATFORM_ORDER.reduce(
      (acc, platform) => {
        const value = sanitized[platform];
        if (value) acc[platform] = normalizeLink(value);
        return acc;
      },
      {} as Record<string, string>,
    );

    const shortcodeFromLink = extractInstagramShortcode(sanitized.instagram);
    const shortcodeForSubmit = shortcodeFromLink || postId || "";
    if (!shortcodeForSubmit) {
      setDraftError("Shortcode Instagram tidak ditemukan pada link.");
      return;
    }

    try {
      setDraftLoading(true);
      const localHistory = loadHistory();
      const nextLinks = { ...draftLinks };
      let hasLocalDuplicate = false;
      PLATFORM_ORDER.forEach((platform) => {
        const normalized = normalizedValues[platform];
        if (normalized && localHistory[platform]?.has(normalized)) {
          nextLinks[platform] = "";
          hasLocalDuplicate = true;
        }
      });
      if (hasLocalDuplicate) {
        setDraftLinks(nextLinks);
        setDraftError("Link sudah pernah dilaporkan. Silakan isi ulang.");
        return;
      }

      const duplicates = await getReposterReportLinkDuplicates(
        token,
        Object.values(sanitized),
      );
      if (duplicates.length > 0) {
        const nextLinksWithDuplicates = { ...draftLinks };
        let hasDuplicate = false;
        PLATFORM_ORDER.forEach((platform) => {
          const normalized = normalizedValues[platform];
          if (normalized && duplicates.includes(normalized)) {
            nextLinksWithDuplicates[platform] = "";
            hasDuplicate = true;
          }
        });
        setDraftLinks(nextLinksWithDuplicates);
        if (hasDuplicate) {
          setDraftError("Link sudah pernah dilaporkan. Silakan isi ulang.");
          return;
        }
      }

      await submitReposterReportLinks(token, {
        shortcode: shortcodeForSubmit,
        userId:
          profile?.userId ||
          profile?.id ||
          profile?.nrp ||
          profile?.user_id ||
          "",
        postId: postId || undefined,
        clientId: clientId || undefined,
        instagramLink: sanitized.instagram,
        facebookLink: sanitized.facebook,
        twitterLink: sanitized.twitter,
        tiktokLink: sanitized.tiktok,
        youtubeLink: sanitized.youtube,
      });

      persistCache(sanitized);
      persistHistory(normalizedValues);
      setDraftSuccess("Laporan terkirim.");
      const reportedSet = readReportedPostIds();
      if (postId) {
        reportedSet.add(postId);
        writeReportedPostIds(reportedSet);
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Gagal mengirim laporan.");
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Informasi tugas
          </p>
          {taskNumber ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-white">
                Nomor tugas
              </span>
              : {taskNumber}
            </p>
          ) : null}
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Form laporan
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Menampilkan dan mengirim tautan laporan untuk setiap platform.
              Instagram, Facebook, dan Twitter wajib diisi.
            </p>
          </div>

          {reportLinksLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              Memuat tautan laporan...
            </div>
          ) : null}

          {!reportLinksLoading && reportLinksNotice ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              <p className="font-semibold text-slate-700 dark:text-slate-100">
                {reportLinksNotice}
              </p>
              {reportLinks.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-300">
                  {reportLinks.map((link) => (
                    <li key={`${link.platform}-${link.url}`}>
                      <span className="font-semibold text-slate-600 dark:text-slate-200">
                        {PLATFORM_LABELS[link.platform] || link.platform}
                      </span>
                      : {link.url}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {reportLinksError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {reportLinksError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {draftEntries.map((entry) => (
              <label
                key={entry.platform}
                className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300"
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {entry.label}
                  {entry.required ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
                      wajib
                    </span>
                  ) : null}
                </span>
                <input
                  type="url"
                  value={entry.value}
                  onChange={(event) =>
                    handleDraftChange(entry.platform, event.target.value)
                  }
                  placeholder={`Masukkan link ${entry.label}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30"
                />
              </label>
            ))}
          </div>

          {draftError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {draftError}
            </div>
          ) : null}

          {draftSuccess ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              {draftSuccess}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={draftLoading}
              className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200"
            >
              {draftLoading ? "Mengirim..." : "Kirim laporan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
