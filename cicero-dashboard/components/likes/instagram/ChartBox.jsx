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
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-blue-700 mb-2 text-center">{title}</div>
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
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}
