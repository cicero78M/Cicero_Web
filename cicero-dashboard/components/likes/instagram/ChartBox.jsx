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
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_0_32px_rgba(30,64,175,0.25)]">
      <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-20 rounded-full bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
      <div className="relative mb-4 text-center text-xs font-semibold uppercase tracking-[0.45em] text-slate-300">
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
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-400">
          Tidak ada data
        </div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}
