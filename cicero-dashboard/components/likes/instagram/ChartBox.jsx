"use client";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import Narrative from "@/components/Narrative";
import { cn } from "@/lib/utils";

const defaultDecorations = (
  <>
    <div className="pointer-events-none absolute -right-12 top-6 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
    <div className="pointer-events-none absolute inset-x-10 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
  </>
);

export default function ChartBox({
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
  titleClassName = "text-cyan-200/80",
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        useDefaultContainerStyle &&
          "p-6 border border-slate-800/60 bg-slate-900/60 shadow-[0_0_32px_rgba(56,189,248,0.08)] backdrop-blur",
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
            "relative text-center text-sm text-slate-400",
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
