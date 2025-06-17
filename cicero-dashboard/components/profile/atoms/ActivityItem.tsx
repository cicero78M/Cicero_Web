"use client";
import { Activity } from "../types";

// This component only renders text and date so the id from `Activity`
// is not required in the props. Using `Omit` keeps the type in sync if
// `Activity` changes in the future.
type ActivityItemProps = Omit<Activity, "id">;

export default function ActivityItem({ text, date }: ActivityItemProps) {
  return (
    <li className="flex justify-between border-b pb-2 last:border-b-0">
      <span className="text-sm">{text}</span>
      <span className="text-xs text-gray-500">{date}</span>
    </li>
  );
}
