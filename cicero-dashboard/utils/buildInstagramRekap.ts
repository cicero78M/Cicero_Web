interface RekapSummary {
  totalIGPost: number;
  totalUser: number;
  totalSudahLike: number;
  totalKurangLike: number;
  totalBelumLike: number;
  totalTanpaUsername: number;
}

export function buildInstagramRekap(
  rekapSummary: RekapSummary,
  chartData: any[],
  clientName?: string,
) {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Selamat Pagi";
  if (hour >= 18) greeting = "Selamat Malam";
  else if (hour >= 12) greeting = "Selamat Siang";

  const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const jam = now.toLocaleTimeString("id-ID", { hour12: false });

  const {
    totalIGPost,
    totalUser,
    totalSudahLike,
    totalKurangLike,
    totalBelumLike,
    totalTanpaUsername,
  } = rekapSummary;

  const groups = chartData.reduce((acc: Record<string, any[]>, u: any) => {
    const name = (
      u.nama_client ||
      u.client_name ||
      u.client ||
      clientName ||
      "LAINNYA"
    ).toUpperCase();
    if (!acc[name]) acc[name] = [];
    acc[name].push(u);
    return acc;
  }, {} as Record<string, any[]>);

  const groupLines = Object.entries(groups)
    .map(([name, users]) => {
      const counts = (users as any[]).reduce(
        (acc, u) => {
          const username = String(u.username || "").trim();
          const jumlah = Number(u.jumlah_like) || 0;
          if (!username) {
            acc.tanpaUsername++;
          } else if (totalIGPost === 0) {
            acc.belum++;
          } else if (jumlah >= totalIGPost) {
            acc.sudah++;
          } else if (jumlah > 0) {
            acc.kurang++;
          } else {
            acc.belum++;
          }
          return acc;
        },
        { total: (users as any[]).length, sudah: 0, kurang: 0, belum: 0, tanpaUsername: 0 },
      );
      return `${name}: ${counts.total} user (✅ ${counts.sudah}, ⚠️ ${counts.kurang}, ❌ ${counts.belum}, ⁉️ ${counts.tanpaUsername})`;
    })
    .join("\n");

  return `${greeting},\n\nRekap Akumulasi Likes Instagram:\n${hari}, ${tanggal}\nJam: ${jam}\n\nJumlah IG Post: ${totalIGPost}\nJumlah User: ${totalUser}\n✅ Sudah Likes: ${totalSudahLike} user\n⚠️ Kurang Likes: ${totalKurangLike} user\n❌ Belum Likes: ${totalBelumLike} user\n⁉️ Tanpa Username IG: ${totalTanpaUsername} user\n\nRekap per Client:\n${groupLines}`;
}

export default buildInstagramRekap;
