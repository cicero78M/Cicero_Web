import CardStat from "./CardStat";

export default function DashboardStats({ igProfile, igPosts, tiktokProfile, tiktokPosts }) {
  const stats = [
    { title: "IG Followers", value: igProfile?.followers ?? 0 },
    { title: "IG Posts", value: igPosts?.length ?? 0 },
    { title: "TikTok Followers", value: tiktokProfile?.followers ?? 0 },
    { title: "TikTok Posts", value: tiktokPosts?.length ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <CardStat key={s.title} title={s.title} value={s.value} />
      ))}
    </div>
  );
}
