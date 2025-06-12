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

export default function PostMetricsChart({ posts = [] }) {
  const chartData = {
    labels: posts.map((p) =>
      new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Likes",
        data: posts.map((p) => p.like_count || 0),
        backgroundColor: "rgba(37,99,235,0.6)",
      },
      {
        label: "Comments",
        data: posts.map((p) => p.comment_count || 0),
        backgroundColor: "rgba(16,185,129,0.6)",
      },
      {
        label: "Shares",
        data: posts.map((p) => p.share_count || 0),
        backgroundColor: "rgba(234,88,12,0.6)",
      },
      {
        label: "Views",
        data: posts.map((p) => p.view_count || 0),
        backgroundColor: "rgba(139,92,246,0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
  };

  return <Bar data={chartData} options={options} />;
}
