import React from "react";

type ClientLikeSummary = {
  key?: string;
  clientName?: string;
  satfung?: string;
  divisi?: string;
};

export function resolveClientDisplayName(client: ClientLikeSummary = {}): string {
  const rawName = String(client.clientName || client.satfung || client.divisi || "").trim();
  if (rawName && rawName.toUpperCase() !== "LAINNYA") return rawName;

  const key = String(client.key || "");
  const [, qualifier] = key.split("::");
  if (qualifier && rawName.toUpperCase() === "LAINNYA") return qualifier;

  return rawName || "Tidak Teridentifikasi";
}

export default function WeeklyPlatformLikesSummary() {
  return <div />;
}
