import { getEngagementStatus } from "@/utils/engagementStatus";

interface TiktokRekapSummary {
  totalTiktokPost: number;
  totalUser: number;
  totalSudahKomentar: number;
  totalKurangKomentar: number;
  totalBelumKomentar: number;
  totalTanpaUsername: number;
}

type TiktokUser = Record<string, any> & {
  username?: string;
  jumlah_komentar?: number | string;
  nama_client?: string;
  client_name?: string;
  client?: string;
};

interface BuildTiktokRekapOptions {
  clientName?: string;
  isDirektoratBinmas?: (name: string) => boolean;
}

export function buildTiktokRekap(
  rekapSummary: TiktokRekapSummary,
  chartData: TiktokUser[],
  { clientName, isDirektoratBinmas }: BuildTiktokRekapOptions = {},
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
    totalTiktokPost,
    totalUser,
    totalSudahKomentar,
    totalKurangKomentar,
    totalBelumKomentar,
    totalTanpaUsername,
  } = rekapSummary;

  const groups = chartData.reduce((acc: Record<string, TiktokUser[]>, user) => {
    const rawName =
      user.nama_client || user.client_name || user.client || clientName || "LAINNYA";
    const key = String(rawName).toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {} as Record<string, TiktokUser[]>);

  const entries = Object.entries(groups);
  const sorter = (a: [string, TiktokUser[]], b: [string, TiktokUser[]]) => {
    if (typeof isDirektoratBinmas === "function") {
      const isBinmasA = isDirektoratBinmas(a[0]);
      const isBinmasB = isDirektoratBinmas(b[0]);
      if (isBinmasA !== isBinmasB) {
        return isBinmasA ? -1 : 1;
      }
    }

    const totalKomentarA = a[1].reduce((acc, user) => acc + (Number(user.jumlah_komentar) || 0), 0);
    const totalKomentarB = b[1].reduce((acc, user) => acc + (Number(user.jumlah_komentar) || 0), 0);
    if (totalKomentarA !== totalKomentarB) {
      return totalKomentarB - totalKomentarA;
    }

    return a[0].localeCompare(b[0]);
  };

  const groupLines = entries
    .sort(sorter)
    .map(([name, users]) => {
      const counts = users.reduce(
        (acc, u) => {
          const username = String(u.username || "").trim();
          const jumlah = Number(u.jumlah_komentar) || 0;
          if (!username) {
            acc.tanpaUsername += 1;
            return acc;
          }

          const status = getEngagementStatus({
            completed: jumlah,
            totalTarget: totalTiktokPost,
          });

          if (status === "sudah") acc.sudah += 1;
          else if (status === "kurang") acc.kurang += 1;
          else acc.belum += 1;
          return acc;
        },
        { total: users.length, sudah: 0, kurang: 0, belum: 0, tanpaUsername: 0 },
      );
      return `${name}: ${counts.total} user (✅ ${counts.sudah}, ⚠️ ${counts.kurang}, ❌ ${counts.belum}, ⁉️ ${counts.tanpaUsername})`;
    })
    .join("\n");

  return `${greeting},\n\nRekap Akumulasi Komentar TikTok:\n${hari}, ${tanggal}\nJam: ${jam}\n\nJumlah TikTok Post: ${totalTiktokPost}\nJumlah User: ${totalUser}\n✅ Sudah Komentar: ${totalSudahKomentar} user\n⚠️ Kurang Komentar: ${totalKurangKomentar} user\n❌ Belum Komentar: ${totalBelumKomentar} user\n⁉️ Tanpa Username TikTok: ${totalTanpaUsername} user\n\nRekap per Client:\n${groupLines}`;
}

export default buildTiktokRekap;
