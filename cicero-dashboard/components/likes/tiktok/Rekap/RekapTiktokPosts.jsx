"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Calendar, Eye, Heart, MessageCircle, Search, Share2 } from "lucide-react";

const PAGE_SIZE = 10;

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function SummaryPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-white/80 px-3 py-2 shadow-inner">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-800">{value}</span>
      </div>
    </div>
  );
}

const RekapTiktokPosts = forwardRef(function RekapTiktokPosts(
  { posts = [], summary = {}, clientName = "", reportContext = {} },
  ref,
) {
  const { periodeLabel } = reportContext || {};
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return posts;
    return posts.filter((post) => (post.caption || "").toLowerCase().includes(term));
  }, [posts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    },
  }));

  return (
    <div ref={scrollContainerRef} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-sky-100/70 bg-white/70 p-4 shadow-inner backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">{clientName || "Profil TikTok"}</span>
          {periodeLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              <Calendar className="h-4 w-4" />
              {periodeLabel}
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryPill icon={<Eye className="h-4 w-4" />} label="Total Post" value={numberFormatter.format(summary.totalPosts || 0)} />
          <SummaryPill
            icon={<Heart className="h-4 w-4" />}
            label="Rata-rata Likes"
            value={numberFormatter.format(Number(summary.avgLikes || 0).toFixed ? Number(summary.avgLikes || 0).toFixed(1) : 0)}
          />
          <SummaryPill
            icon={<MessageCircle className="h-4 w-4" />}
            label="Rata-rata Komentar"
            value={numberFormatter.format(Number(summary.avgComments || 0).toFixed ? Number(summary.avgComments || 0).toFixed(1) : 0)}
          />
          <SummaryPill
            icon={<Share2 className="h-4 w-4" />}
            label="Rata-rata Share"
            value={numberFormatter.format(Number(summary.avgShares || 0).toFixed ? Number(summary.avgShares || 0).toFixed(1) : 0)}
          />
          <SummaryPill
            icon={<Eye className="h-4 w-4" />}
            label="Rata-rata Views"
            value={numberFormatter.format(Number(summary.avgViews || 0).toFixed ? Number(summary.avgViews || 0).toFixed(1) : 0)}
          />
          <SummaryPill
            icon={<Heart className="h-4 w-4" />}
            label="Engagement Rate"
            value={`${Number(summary.engagementRate || 0).toFixed(2)}%`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner backdrop-blur">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">{`Menampilkan ${filtered.length} post`}</div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 shadow-inner">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari caption"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-2">Caption</th>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2 text-right">Views</th>
                <th className="px-4 py-2 text-right">Likes</th>
                <th className="px-4 py-2 text-right">Komentar</th>
                <th className="px-4 py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((post) => (
                <tr key={post.id || post.created_at} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-800">
                    <div className="line-clamp-2 text-sm font-semibold">{post.caption || "(Tanpa caption)"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(post.created_at)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{numberFormatter.format(post.view_count || 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{numberFormatter.format(post.like_count || 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{numberFormatter.format(post.comment_count || 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{numberFormatter.format(post.share_count || 0)}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Tidak ada data post untuk filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
          <div>
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-40"
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-40"
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RekapTiktokPosts;
