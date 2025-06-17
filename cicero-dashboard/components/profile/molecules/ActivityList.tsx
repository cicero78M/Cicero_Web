"use client";
import ActivityItem from "../atoms/ActivityItem";
import { Activity } from "../types";

export default function ActivityList({ items }: { items: Activity[] }) {
  return (
    <section className="md:col-span-3 bg-white rounded-xl shadow p-6">
      <h2 className="font-semibold mb-4 text-blue-700">Aktivitas Terbaru</h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <ActivityItem key={a.id} text={a.text} date={a.date} />
        ))}
      </ul>
    </section>
  );
}
