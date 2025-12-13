interface TiktokPostSummary {
  totalPosts: number;
  postingFrequency: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews: number;
  engagementRate: number;
  followerRatio: number;
}

interface TiktokPostRekapOptions {
  clientName?: string;
  periodeLabel?: string;
  scope?: "client" | "all";
}

interface TiktokPostLike {
  caption?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  created_at?: string;
}

export function buildTiktokPostRekap(
  summary: TiktokPostSummary,
  posts: TiktokPostLike[],
  { clientName, periodeLabel, scope = "client" }: TiktokPostRekapOptions = {},
) {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Selamat Pagi";
  if (hour >= 18) greeting = "Selamat Malam";
  else if (hour >= 12) greeting = "Selamat Siang";

  const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const jam = now.toLocaleTimeString("id-ID", { hour12: false });

  const scopeLabel = scope === "all" ? " (Satker Jajaran)" : "";
  const contextLabel = periodeLabel ? `Periode: ${periodeLabel}\n` : "";
  const clientLabel = clientName ? `Client: ${clientName}${scopeLabel}\n` : "";

  const topPosts = [...posts]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 3)
    .map((post, index) => {
      const likes = Number(post.like_count) || 0;
      const comments = Number(post.comment_count) || 0;
      const shares = Number(post.share_count) || 0;
      const views = Number(post.view_count) || 0;
      const caption = String(post.caption || "").trim() || "(Tanpa caption)";
      const date = post.created_at
        ? new Date(post.created_at).toLocaleDateString("id-ID")
        : "-";
      return `${index + 1}. ${caption}\n   ${date} — ${views} views, ${likes} likes, ${comments} komentar, ${shares} share`;
    })
    .join("\n");

  return `${greeting},\n\nRekap Performansi Post TikTok:\n${hari}, ${tanggal}\nJam: ${jam}\n${clientLabel}${contextLabel}\n` +
    `Total Post: ${summary.totalPosts}\n` +
    `Post/Hari: ${summary.postingFrequency.toFixed(2)}\n` +
    `Rata-rata Views: ${summary.avgViews.toFixed(1)}\n` +
    `Rata-rata Likes: ${summary.avgLikes.toFixed(1)}\n` +
    `Rata-rata Komentar: ${summary.avgComments.toFixed(1)}\n` +
    `Rata-rata Share: ${summary.avgShares.toFixed(1)}\n` +
    `Engagement Rate: ${summary.engagementRate.toFixed(2)}%\n` +
    `Rasio Follower/Following: ${summary.followerRatio.toFixed(2)}\n\n` +
    `Top 3 Post dengan Views Tertinggi:\n${topPosts}`;
}

export default buildTiktokPostRekap;
