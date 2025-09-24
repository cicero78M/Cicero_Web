"use client";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import Narrative from "@/components/Narrative";

export default function ChartBox({
  title,
  users,
  orientation = "vertical",
  totalPost,
  narrative,
  groupBy,
  sortBy,
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_0_32px_rgba(56,189,248,0.08)] backdrop-blur">
      <div className="pointer-events-none absolute -right-12 top-6 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
      <div className="relative mb-4 text-center text-sm font-semibold uppercase tracking-[0.4em] text-cyan-200/80">
        {title}
      </div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          orientation={orientation}
          totalPost={totalPost}
          fieldJumlah="jumlah_like"
          labelSudah="User Sudah Like"
          labelKurang="User Kurang Like"
          labelBelum="User Belum Like"
          labelTotal="Total Likes"
          groupBy={groupBy}
          showTotalUser
          labelTotalUser="Jumlah User"
          sortBy={sortBy}
        />
      ) : (
        <div className="relative text-center text-sm text-slate-400">
          Tidak ada data
        </div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}
