"use client";
import { motion } from "framer-motion";
import { Stat } from "../types";

export default function StatCard({ label, value }: Stat) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow p-4 flex flex-col items-center"
    >
      <span className="text-xl font-bold">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </motion.div>
  );
}
