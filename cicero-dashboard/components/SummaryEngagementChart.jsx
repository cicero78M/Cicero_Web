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

export default function SummaryEngagementChart({ likes = 0, comments = 0, views = 0 }) {
  const chartData = {
    labels: ["Avg Likes", "Avg Comments", "Avg Views"],
    datasets: [
      {
        label: "Avg",
        data: [likes, comments, views],
        backgroundColor: [
          "rgba(37,99,235,0.6)",
          "rgba(16,185,129,0.6)",
          "rgba(234,88,12,0.6)",
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };

  return <Bar data={chartData} options={options} />;
}
