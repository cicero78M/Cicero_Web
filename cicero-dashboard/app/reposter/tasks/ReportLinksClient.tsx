"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  getReposterReportLinkDetail,
  getReposterReportLinkDuplicates,
  isAbortError,
  ReportLinkDetailInfo,
  REPOSTER_REPORTED_POSTS_KEY,
  REPOSTER_SPECIAL_REPORTED_POSTS_KEY,
  submitReposterReportLinks,
} from "@/utils/api";

const PLATFORM_ORDER = [
  "instagram",
  "facebook",
  "twitter",
  "tiktok",
  "youtube",
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  youtube: "YouTube",
};

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

type ReportLinksClientProps = {
  isSpecial?: boolean;
};

function readReportedPostIds(storageKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(storageKey);
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

function writeReportedPostIds(storageKey: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(Array.from(ids)),
  );
}

export default function ReportLinksClient({
  isSpecial = false,
}: ReportLinksClientProps) {
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
  const reportCacheKey = isSpecial
    ? "reposter_special_report_links_cache"
    : "reposter_report_links_cache";
  const reportHistoryKey = isSpecial
    ? "reposter_special_report_links_history"
    : "reposter_report_links_history";
  const reportedPostsKey = isSpecial
    ? REPOSTER_SPECIAL_REPORTED_POSTS_KEY
    : REPOSTER_REPORTED_POSTS_KEY;

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
  const [reportInfo, setReportInfo] = useState<ReportLinkDetailInfo | null>(
    null,
  );
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

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

  const captionText = reportInfo?.caption?.trim() ?? "";
  const hasCaption = Boolean(captionText);

  useEffect(() => {
    setIsCaptionExpanded(false);
  }, [postId, reportInfo?.caption]);

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

  const fallbackShortcode = useMemo(() => {
    const draftShortcode = extractInstagramShortcode(
      draftLinks.instagram ?? "",
    );
    if (draftShortcode) return draftShortcode;
    return profileShortcode || "";
  }, [draftLinks.instagram, profileShortcode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached: Record<string, string> = {};
    const raw = window.localStorage.getItem(reportCacheKey);
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
  }, [reportCacheKey, userKey]);

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
    setReportInfo(null);
    if (!reportUserId) {
      setReportLinksError("User ID belum tersedia.");
      return;
    }
    if (!postId && !fallbackShortcode) {
      setReportLinksNotice(
        "Masukkan link Instagram untuk memuat tautan laporan sebelumnya.",
      );
      return;
    }
    const controller = new AbortController();
    setReportLinksLoading(true);
    getReposterReportLinkDetail(
      token,
      {
        postId: postId || undefined,
        shortcode: postId ? undefined : fallbackShortcode,
        userId: reportUserId,
        isSpecial,
      },
      controller.signal,
    )
      .then((detail) => {
        setReportLinks(detail.links);
        setReportInfo(detail.info);
        if (detail.links.length === 0) {
          setReportLinksNotice("Belum ada tautan laporan yang tercatat.");
          return;
        }
        const mapped: Record<string, string> = {};
        detail.links.forEach((link) => {
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
        if (isAbortError(err, controller.signal)) return;
        setReportLinksError(
          err instanceof Error ? err.message : "Gagal memuat tautan laporan.",
        );
      })
      .finally(() => {
        setReportLinksLoading(false);
      });
    return () => controller.abort();
  }, [fallbackShortcode, isSpecial, postId, reportUserId, token]);

  const handleDraftChange = (platform: string, value: string) => {
    setDraftError("");
    setDraftSuccess("");
    setDraftLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const persistCache = (nextLinks: Record<string, string>) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(reportCacheKey);
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
    window.localStorage.setItem(reportCacheKey, JSON.stringify(cache));
  };

  const loadHistory = () => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(reportHistoryKey);
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
    const raw = window.localStorage.getItem(reportHistoryKey);
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
    window.localStorage.setItem(reportHistoryKey, JSON.stringify(cache));
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
    const shortcodeForSubmit =
      postId || shortcodeFromLink || profileShortcode || "";
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

      const duplicates = await getReposterReportLinkDuplicates(token, Object.values(sanitized), {
        isSpecial,
      });
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
      }, {
        isSpecial,
      });

      persistCache(sanitized);
      persistHistory(normalizedValues);
      setDraftSuccess("Laporan terkirim.");
      const reportedSet = readReportedPostIds(reportedPostsKey);
      if (postId) {
        reportedSet.add(postId);
        writeReportedPostIds(reportedPostsKey, reportedSet);
      }
    } catch (err) {
      setDraftError(
        err instanceof Error ? err.message : "Gagal mengirim laporan.",
      );
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Informasi tugas
          </p>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                {reportInfo?.imageUrl ? (
                  <img
                    src={reportInfo.imageUrl}
                    alt={`Gambar tugas ${taskNumber || postId || ""}`.trim()}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-xs text-slate-400">
                    Gambar belum tersedia
                  </div>
                )}
              </div>
              {reportInfo?.imageUrl ? (
                <a
                  href={reportInfo.imageUrl}
                  className="text-xs font-semibold text-sky-600 hover:underline dark:text-cyan-300"
                  rel="noreferrer"
                  target="_blank"
                >
                  Buka gambar asli
                </a>
              ) : null}
            </div>
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Nomor tugas
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    {taskNumber || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Post ID
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    {postId || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Client ID
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    {clientId || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Platform sumber
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    {sourcePlatform || "Instagram"}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Caption
                </p>
                {hasCaption ? (
                  <div className="mt-2 space-y-2">
                    <p
                      className={`whitespace-pre-line text-sm text-slate-600 dark:text-slate-200 ${
                        isCaptionExpanded ? "" : "line-clamp-4"
                      }`}
                    >
                      {captionText}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-600 hover:underline dark:text-cyan-300"
                      onClick={() => setIsCaptionExpanded((prev) => !prev)}
                    >
                      {isCaptionExpanded ? "Tutup" : "Lihat selengkapnya"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">-</p>
                )}
              </div>
            </div>
          </div>
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
