"use client";
import { Activity } from "../types";

export default function ActivityItem({ text, date }: Activity) {
  return (
    <li className="flex justify-between border-b pb-2 last:border-b-0">
      <span className="text-sm">{text}</span>
      <span className="text-xs text-gray-500">{date}</span>
    </li>
  );
}
