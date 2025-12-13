"use client";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import Narrative from "@/components/Narrative";
import { cn } from "@/lib/utils";

const defaultDecorations = (
  <>
    <div className="pointer-events-none absolute -right-12 top-6 h-32 w-32 rounded-full bg-cyan-200/50 blur-3xl" />
    <div className="pointer-events-none absolute inset-x-10 top-0 h-16 bg-gradient-to-b from-white/60 to-transparent blur-2xl" />
  </>
);

export default function InstagramInsightChartBox({
  title,
  users,
  orientation = "vertical",
  totalPost,
  narrative,
  groupBy,
  sortBy,
  fieldJumlah = "jumlah_like",
  labelSudah = "User Sudah Like",
  labelKurang = "User Kurang Like",
  labelBelum = "User Belum Like",
  labelTotal = "Total Likes",
  labelTotalUser = "Jumlah User",
  showTotalUser = true,
  containerClassName,
  emptyStateClassName,
  useDefaultContainerStyle = true,
  decorations = defaultDecorations,
  titleClassName = "text-sky-600",
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        useDefaultContainerStyle &&
          "p-6 border border-sky-100/60 bg-white/70 shadow-[0_25px_55px_-30px_rgba(56,189,248,0.45)] backdrop-blur",
        containerClassName,
      )}
    >
      {decorations}
      <div
        className={cn(
          "relative mb-4 text-center text-sm font-semibold uppercase tracking-[0.4em]",
          titleClassName,
        )}
      >
        {title}
      </div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          orientation={orientation}
          totalPost={totalPost}
          fieldJumlah={fieldJumlah}
          labelSudah={labelSudah}
          labelKurang={labelKurang}
          labelBelum={labelBelum}
          labelTotal={labelTotal}
          groupBy={groupBy}
          showTotalUser={showTotalUser}
          labelTotalUser={labelTotalUser}
          sortBy={sortBy}
        />
      ) : (
        <div
          className={cn(
            "relative text-center text-sm text-slate-500",
            emptyStateClassName,
          )}
        >
          Tidak ada data
        </div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}
