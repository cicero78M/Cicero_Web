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

export default function EngagementByTypeChart({ data = [] }) {
  const chartData = {
    labels: data.map((d) => d.type),
    datasets: [
      {
        label: "Avg Engagement %",
        data: data.map((d) => d.engagement),
        backgroundColor: "rgba(16,185,129,0.6)",
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
