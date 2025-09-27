"use client";
import { cloneElement, useState } from "react";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping";
import { showToast } from "@/utils/showToast";
import Link from "next/link";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, { VIEW_OPTIONS } from "@/components/ViewDataSelector";
import { cn } from "@/lib/utils";
import {
  Music,
  User,
  MessageCircle,
  X,
  ArrowRight,
  UserX,
  Copy,
} from "lucide-react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";

export default function TiktokEngagementInsightPage() {
  useRequireAuth();
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const viewOptions = VIEW_OPTIONS;

  const {
    chartData,
    rekapSummary,
    isDirectorate,
    clientName,
    isDitbinmasRole,
    isDitbinmasScopedClient,
    loading,
    error,
  } = useTiktokCommentsData({ viewBy, customDate, fromDate, toDate });

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100">
        <div className="rounded-3xl border border-red-500/40 bg-slate-900/70 px-8 py-6 text-center text-red-200 shadow-[0_0_35px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      </div>
    );

  const totalUser = Number(rekapSummary.totalUser) || 0;
  const totalTanpaUsername = Number(rekapSummary.totalTanpaUsername) || 0;
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);
  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  const shouldGroupByClient =
    isDirectorate && !isDitbinmasScopedClient && !isDitbinmasRole;
  const directorateGroupBy = shouldGroupByClient ? "client_id" : "divisi";
  const directorateOrientation = shouldGroupByClient ? "horizontal" : "vertical";
  const directorateTitle = shouldGroupByClient
    ? "POLRES JAJARAN"
    : `DIVISI / SATFUNG${clientName ? ` - ${clientName}` : ""}`;

  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);
  const DIRECTORATE_NAME = "direktorat binmas";
  const normalizeClientName = (name = "") =>
    String(name).toLowerCase().replace(/\s+/g, " ").trim();
  const isDirektoratBinmas = (name = "") => {
    const normalized = normalizeClientName(name);
    if (!normalized.startsWith(DIRECTORATE_NAME)) {
      return false;
    }
    const nextChar = normalized.charAt(DIRECTORATE_NAME.length);
    return nextChar === "" || /[^a-z0-9]/.test(nextChar);
  };

  async function handleCopyRekap() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = "Selamat Pagi";
    if (hour >= 18) greeting = "Selamat Malam";
    else if (hour >= 12) greeting = "Selamat Siang";

    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const jam = now.toLocaleTimeString("id-ID", { hour12: false });

    const {
      totalTiktokPost,
      totalUser,
      totalSudahKomentar,
      totalKurangKomentar,
      totalBelumKomentar,
      totalTanpaUsername,
    } = rekapSummary;

    const groups = chartData.reduce((acc, u) => {
      const name =
        u.nama_client ||
        u.client_name ||
        u.client ||
        clientName ||
        "LAINNYA";
      const key = String(name).toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    }, {});

    const sortedGroupEntries = Object.entries(groups).sort(
      ([nameA, usersA], [nameB, usersB]) => {
        const isBinmasA = isDirektoratBinmas(nameA);
        const isBinmasB = isDirektoratBinmas(nameB);
        if (isBinmasA !== isBinmasB) {
          return isBinmasA ? -1 : 1;
        }

        const totalKomentarA = usersA.reduce(
          (acc, user) => acc + (Number(user.jumlah_komentar) || 0),
          0,
        );
        const totalKomentarB = usersB.reduce(
          (acc, user) => acc + (Number(user.jumlah_komentar) || 0),
          0,
        );
        if (totalKomentarA !== totalKomentarB) {
          return totalKomentarB - totalKomentarA;
        }

        return nameA.localeCompare(nameB);
      },
    );

    const groupLines = sortedGroupEntries
      .map(([name, users]) => {
        const counts = users.reduce(
          (acc, u) => {
            const username = String(u.username || "").trim();
            const jumlah = Number(u.jumlah_komentar) || 0;
            if (!username) {
              acc.tanpaUsername++;
            } else if (totalTiktokPost === 0) {
              acc.belum++;
            } else if (jumlah >= totalTiktokPost * 0.5) {
              acc.sudah++;
            } else if (jumlah > 0) {
              acc.kurang++;
            } else {
              acc.belum++;
            }
            return acc;
          },
          { total: users.length, sudah: 0, kurang: 0, belum: 0, tanpaUsername: 0 },
        );
        return `${name}: ${counts.total} user (✅ ${counts.sudah}, ⚠️ ${counts.kurang}, ❌ ${counts.belum}, ⁉️ ${counts.tanpaUsername})`;
      })
      .join("\n");

    const message = `${greeting},\n\nRekap Akumulasi Komentar TikTok:\n${hari}, ${tanggal}\nJam: ${jam}\n\nJumlah TikTok Post: ${totalTiktokPost}\nJumlah User: ${totalUser}\n✅ Sudah Komentar: ${totalSudahKomentar} user\n⚠️ Kurang Komentar: ${totalKurangKomentar} user\n❌ Belum Komentar: ${totalBelumKomentar} user\n⁉️ Tanpa Username TikTok: ${totalTanpaUsername} user\n\nRekap per Client:\n${groupLines}`;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        showToast("Rekap disalin ke clipboard.", "success");
        return;
      } catch (error) {
        showToast(
          "Gagal menyalin rekap. Izinkan akses clipboard di browser Anda.",
          "error",
        );
      }
    }

    if (typeof window !== "undefined") {
      window.prompt("Salin rekap komentar secara manual:", message);
      showToast(
        "Clipboard tidak tersedia. Silakan salin rekap secara manual.",
        "info",
      );
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
      aria-busy={loading}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-[160px]" />
        <div className="absolute right-[-120px] top-1/3 h-[380px] w-[380px] rounded-full bg-cyan-400/20 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-[-180px] h-[320px] bg-gradient-to-t from-slate-900 via-slate-950/60 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <div className="flex flex-1 flex-col gap-10">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-slate-50 md:text-4xl">
              TikTok Engagement Insight
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 md:text-base">
              Pantau performa enggagement personel TikTok untuk{" "}
              <span className="font-semibold text-cyan-200">
                {clientName || "satuan Anda"}
              </span>
              . Gunakan panel ini untuk melihat kepatuhan komentar, memantau
              Satker yang aktif / kurang aktif / belum aktif dan mengambil tindakan cepat ketika komentar
              belum terpenuhi.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              options={viewOptions}
              date={
                viewBy === "custom_range"
                  ? { startDate: fromDate, endDate: toDate }
                  : customDate
              }
              onDateChange={(val) => {
                if (viewBy === "custom_range") {
                  setFromDate(val.startDate || "");
                  setToDate(val.endDate || "");
                } else {
                  setCustomDate(val);
                }
              }}
              className="justify-start gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/70 px-4 py-4 backdrop-blur"
              labelClassName="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400/90"
              controlClassName="border-slate-700/60 bg-slate-900/70 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryItem
                label="Jumlah TikTok Post"
                value={rekapSummary.totalTiktokPost}
                color="fuchsia"
                icon={<Music className="h-5 w-5" />}
              />
              <SummaryItem
                label="Total User"
                value={rekapSummary.totalUser}
                color="slate"
                icon={<User className="h-5 w-5" />}
              />
              <SummaryItem
                label="Sudah Komentar"
                value={rekapSummary.totalSudahKomentar}
                color="green"
                icon={<MessageCircle className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalSudahKomentar)}
              />
              <SummaryItem
                label="Kurang Komentar"
                value={rekapSummary.totalKurangKomentar}
                color="amber"
                icon={<MessageCircle className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalKurangKomentar)}
              />
              <SummaryItem
                label="Belum Komentar"
                value={rekapSummary.totalBelumKomentar}
                color="red"
                icon={<X className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalBelumKomentar)}
              />
              <SummaryItem
                label="Tanpa Username"
                value={rekapSummary.totalTanpaUsername}
                color="violet"
                icon={<UserX className="h-5 w-5" />}
                percentage={getPercentage(
                  rekapSummary.totalTanpaUsername,
                  totalUser,
                )}
              />
            </div>
          </div>

          {isDirectorate ? (
            <ChartBox
              title={directorateTitle}
              users={chartData}
              totalPost={rekapSummary.totalTiktokPost}
              groupBy={directorateGroupBy}
              orientation={directorateOrientation}
              sortBy="percentage"
              narrative=
                shouldGroupByClient
                  ? undefined
                  : "Grafik ini menampilkan perbandingan capaian komentar berdasarkan divisi/satfung."
            />
          ) : (
            <div className="flex flex-col gap-6">
              <ChartBox
                title="BAG"
                users={kelompok.BAG}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi BAG."
                sortBy="percentage"
              />
              <ChartBox
                title="SAT"
                users={kelompok.SAT}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SAT."
                sortBy="percentage"
              />
              <ChartBox
                title="SI & SPKT"
                users={kelompok["SI & SPKT"]}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SI & SPKT."
                sortBy="percentage"
              />
              <ChartBox
                title="LAINNYA"
                users={kelompok.LAINNYA}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi lainnya."
                sortBy="percentage"
              />
              <ChartHorizontal
                title="POLSEK"
                users={kelompok.POLSEK}
                totalPost={rekapSummary.totalTiktokPost}
                fieldJumlah="jumlah_komentar"
                labelSudah="User Sudah Komentar"
                labelBelum="User Belum Komentar"
                labelTotal="Total Komentar"
                showTotalUser
                sortBy="percentage"
              />
              <Narrative>
                Grafik POLSEK menggambarkan distribusi komentar antar user dari
                setiap polsek serta total komentar yang berhasil dikumpulkan.
              </Narrative>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={handleCopyRekap}
              className="group flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.25)] transition hover:border-emerald-300/70 hover:bg-emerald-400/20"
            >
              <Copy className="h-4 w-4" />
              Rekap Komentar
            </button>
            <Link
              href="/comments/tiktok/rekap"
              className="group flex items-center gap-2 rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-fuchsia-200 shadow-[0_0_25px_rgba(217,70,239,0.25)] transition hover:border-fuchsia-300/70 hover:bg-fuchsia-500/20"
            >
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              Lihat Rekap Detail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({
  title,
  users,
  orientation = "vertical",
  totalPost,
  narrative,
  groupBy,
  sortBy,
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_0_32px_rgba(30,64,175,0.25)]">
      <div className="absolute inset-x-6 top-0 h-20 rounded-full bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
      <div className="relative text-center">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
          {title}
        </div>
      </div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          orientation={orientation}
          totalPost={totalPost}
          fieldJumlah="jumlah_komentar"
          labelSudah="User Sudah Komentar"
          labelKurang="User Kurang Komentar"
          labelBelum="User Belum Komentar"
          labelTotal="Total Komentar"
          groupBy={groupBy}
          showTotalUser
          labelTotalUser="Jumlah User"
          sortBy={sortBy}
        />
      ) : (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-400">
          Tidak ada data
        </div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}

function SummaryItem({ label, value, color = "gray", icon, percentage }) {
  const palettes = {
    fuchsia: {
      icon: "text-fuchsia-300",
      border: "border-fuchsia-500/40",
      glow: "from-fuchsia-500/20 via-fuchsia-500/10 to-transparent",
      bar: "from-fuchsia-400 to-pink-500",
    },
    green: {
      icon: "text-emerald-300",
      border: "border-emerald-500/40",
      glow: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      bar: "from-emerald-400 to-lime-400",
    },
    red: {
      icon: "text-rose-300",
      border: "border-rose-500/40",
      glow: "from-rose-500/25 via-rose-500/10 to-transparent",
      bar: "from-rose-400 to-orange-400",
    },
    amber: {
      icon: "text-amber-200",
      border: "border-amber-400/40",
      glow: "from-amber-400/20 via-amber-500/10 to-transparent",
      bar: "from-amber-300 to-orange-400",
    },
    violet: {
      icon: "text-violet-300",
      border: "border-violet-500/40",
      glow: "from-violet-500/20 via-violet-500/10 to-transparent",
      bar: "from-violet-400 to-purple-500",
    },
    slate: {
      icon: "text-slate-300",
      border: "border-slate-500/40",
      glow: "from-slate-500/20 via-slate-500/10 to-transparent",
      bar: "from-slate-300 to-slate-400",
    },
  };
  const palette = palettes[color] || palettes.slate;
  const formattedPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? `${percentage.toFixed(1).replace(".0", "")} %`
      : null;
  const progressWidth =
    typeof percentage === "number"
      ? `${Math.min(100, Math.max(0, percentage))}%`
      : "0%";
  const iconElement = icon
    ? cloneElement(icon, {
        className: cn(
          "h-6 w-6",
          palette.icon,
          icon.props?.className,
        ),
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-[0_0_24px_rgba(30,64,175,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_36px_rgba(34,211,238,0.25)]">
      <div
        className={cn(
          "pointer-events-none absolute inset-px rounded-[1.35rem] bg-gradient-to-br opacity-70 blur-2xl",
          palette.glow,
        )}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/80">
              {iconElement}
            </span>
            <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              {label}
            </div>
          </div>
          <span
            className={cn(
              "h-10 w-10 rounded-full border bg-slate-950/70",
              palette.border,
            )}
          />
        </div>
        <div className="text-3xl font-semibold text-slate-50 md:text-4xl">
          {value}
        </div>
        {formattedPercentage && (
          <div className="mt-1 flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-300">
              {formattedPercentage}
            </span>
            <div className="h-1.5 w-full rounded-full bg-slate-800/80">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  palette.bar,
                )}
                style={{ width: progressWidth }}
                role="progressbar"
                aria-valuenow={Math.round(Number(percentage) || 0)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label} ${formattedPercentage}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

