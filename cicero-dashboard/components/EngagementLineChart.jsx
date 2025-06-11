"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function EngagementLineChart({ data = [] }) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Engagement Rate %",
        data: data.map((d) => d.rate),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.3)",
        fill: true,
      },
    ],
  };
  const options = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };
  return <Line data={chartData} options={options} />;
}
