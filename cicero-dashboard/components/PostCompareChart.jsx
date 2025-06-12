"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function PostCompareChart({ client, competitor }) {
  if (!client || !competitor) return null;
  const chartData = {
    labels: [
      "Followers",
      "Following",
      "Follower/Following",
      "Posts / Day",
      "Avg Likes",
      "Avg Comments",
      "Avg Shares",
      "Avg Views",
    ],
    datasets: [
      {
        label: client.username,
        data: [
          client.followers || 0,
          client.following || 0,
          client.followerRatio || 0,
          client.postRate || 0,
          client.avgLikes || 0,
          client.avgComments || 0,
          client.avgShares || 0,
          client.avgViews || 0,
        ],
        backgroundColor: "rgba(37,99,235,0.6)",
      },
      {
        label: competitor.username,
        data: [
          competitor.followers || 0,
          competitor.following || 0,
          competitor.followerRatio || 0,
          competitor.postRate || 0,
          competitor.avgLikes || 0,
          competitor.avgComments || 0,
          competitor.avgShares || 0,
          competitor.avgViews || 0,
        ],
        backgroundColor: "rgba(234,88,12,0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y",
    scales: { x: { beginAtZero: true } },
  };

  return <Bar data={chartData} options={options} />;
}
