"use client";
import CardStat from "@/components/CardStat";
import EngagementLineChart from "@/components/EngagementLineChart";
import EngagementByTypeChart from "@/components/EngagementByTypeChart";
import HeatmapTable from "@/components/HeatmapTable";

const profile = {
  username: "john_doe",
  followers: 1500,
  following: 300,
  bio: "Travel enthusiast and foodie",
};

const posts = [
  {
    id: 1,
    created_at: "2024-06-01T08:00:00Z",
    type: "image",
    caption: "Exploring mountains #adventure @buddy",
    like_count: 200,
    comment_count: 20,
    share_count: 5,
  },
  {
    id: 2,
    created_at: "2024-06-03T12:00:00Z",
    type: "video",
    caption: "Delicious food #foodie",
    like_count: 150,
    comment_count: 25,
    share_count: 8,
  },
  {
    id: 3,
    created_at: "2024-06-05T18:30:00Z",
    type: "carousel",
    caption: "Sunset view #travel #sunset",
    like_count: 300,
    comment_count: 30,
    share_count: 12,
  },
  {
    id: 4,
    created_at: "2024-06-06T09:15:00Z",
    type: "image",
    caption: "Morning vibes #coffee @cafe",
    like_count: 180,
    comment_count: 15,
    share_count: 3,
  },
  {
    id: 5,
    created_at: "2024-06-07T20:45:00Z",
    type: "video",
    caption: "Night walk #citylife",
    like_count: 220,
    comment_count: 28,
    share_count: 6,
  },
  {
    id: 6,
    created_at: "2024-06-09T14:20:00Z",
    type: "image",
    caption: "Beach day #vacation #sun",
    like_count: 260,
    comment_count: 18,
    share_count: 10,
  },
  {
    id: 7,
    created_at: "2024-06-10T11:00:00Z",
    type: "carousel",
    caption: "Weekend trip #travel @friend",
    like_count: 240,
    comment_count: 22,
    share_count: 7,
  },
  {
    id: 8,
    created_at: "2024-06-11T15:30:00Z",
    type: "video",
    caption: "Cooking time #foodie @chef",
    like_count: 210,
    comment_count: 26,
    share_count: 9,
  },
];

function analyzeSentiment(text) {
  const positive = ["love", "great", "happy", "enjoy", "good", "nice"];
  const negative = ["bad", "sad", "angry", "hate"];
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  words.forEach((w) => {
    if (positive.includes(w)) score += 1;
    if (negative.includes(w)) score -= 1;
  });
  if (score > 0) return "Positive";
  if (score < 0) return "Negative";
  return "Neutral";
}

export default function SocialMediaContentManagerPage() {
  const followerRatio = (profile.followers / profile.following).toFixed(2);

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const firstDate = new Date(sortedPosts[0].created_at);
  const lastDate = new Date(sortedPosts[sortedPosts.length - 1].created_at);
  const diffDays =
    (lastDate - firstDate) / (1000 * 60 * 60 * 24) || 1;
  const postingFreq = (sortedPosts.length / diffDays).toFixed(2);

  const hashtagMap = {};
  const mentionMap = {};
  const lineData = [];
  const typeMap = {};
  const heatmap = {};
  const sentimentCount = { Positive: 0, Neutral: 0, Negative: 0 };
  const buckets = ["0-5", "6-11", "12-17", "18-23"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  sortedPosts.forEach((p) => {
    const eng =
      ((p.like_count + p.comment_count + p.share_count) / profile.followers) *
      100;
    lineData.push({
      date: new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      rate: parseFloat(eng.toFixed(2)),
    });

    if (!typeMap[p.type]) typeMap[p.type] = { total: 0, count: 0 };
    typeMap[p.type].total += eng;
    typeMap[p.type].count += 1;

    const tags = p.caption.match(/#\w+/g) || [];
    tags.forEach((t) => {
      hashtagMap[t] = (hashtagMap[t] || 0) + 1;
    });
    const mentions = p.caption.match(/@\w+/g) || [];
    mentions.forEach((m) => {
      mentionMap[m] = (mentionMap[m] || 0) + 1;
    });

    const sentiment = analyzeSentiment(p.caption);
    sentimentCount[sentiment] += 1;

    const d = new Date(p.created_at);
    const day = dayNames[d.getDay()];
    const bucket = buckets[Math.floor(d.getHours() / 6)];
    if (!heatmap[day]) heatmap[day] = {};
    if (!heatmap[day][bucket]) heatmap[day][bucket] = 0;
    heatmap[day][bucket] += eng / 10; // scale for color
  });

  const typeData = Object.entries(typeMap).map(([type, v]) => ({
    type,
    engagement: parseFloat((v.total / v.count).toFixed(2)),
  }));

  const topHashtags = Object.entries(hashtagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topMentions = Object.entries(mentionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const network = [
    { user: "@buddy", interactions: 5 },
    { user: "@friend", interactions: 3 },
    { user: "@chef", interactions: 2 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-blue-700">
          Social Media Content Manager
        </h1>
        <p className="text-gray-600">Analisis konten menggunakan data dummy.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardStat title="Followers" value={profile.followers} />
          <CardStat title="Following" value={profile.following} />
          <CardStat title="Follower/Following" value={followerRatio} />
          <CardStat title="Posts / Day" value={postingFreq} />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Engagement Trend</h2>
          <EngagementLineChart data={lineData} />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Engagement by Content Type</h2>
          <EngagementByTypeChart data={typeData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Top Hashtags</h3>
            <ul className="list-disc ml-5 text-sm">
              {topHashtags.map(([t, c]) => (
                <li key={t}>{t} - {c}x</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Top Mentions</h3>
            <ul className="list-disc ml-5 text-sm">
              {topMentions.map(([m, c]) => (
                <li key={m}>{m} - {c}x</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Posting Time Heatmap</h3>
          <HeatmapTable data={heatmap} days={dayNames} buckets={buckets} />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Sentiment Overview</h3>
          <ul className="list-disc ml-5 text-sm">
            <li>Positive: {sentimentCount["Positive"]}</li>
            <li>Neutral: {sentimentCount["Neutral"]}</li>
            <li>Negative: {sentimentCount["Negative"]}</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Top Interactors</h3>
          <ul className="list-disc ml-5 text-sm">
            {network.map((n) => (
              <li key={n.user}>{n.user} - {n.interactions} interactions</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
