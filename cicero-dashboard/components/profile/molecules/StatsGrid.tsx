"use client";
import StatCard from "../atoms/StatCard";
import { Stat } from "../types";

export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="md:col-span-2 grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} label={s.label} value={s.value} />
      ))}
    </section>
  );
}
