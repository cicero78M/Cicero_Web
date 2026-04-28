function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${Math.round(value)}%`;
}

function severityRank(level) {
  switch (level) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function buildRiskComplianceAlertCenter({
  platform = "Instagram",
  periodLabel = "hari ini",
  totalUsers = 0,
  completedCount = 0,
  partialCount = 0,
  notStartedCount = 0,
  missingUsernameCount = 0,
  complianceRate,
  hasPremiumAccess = false,
  premiumHref = "/premium",
}) {
  const platformLabel = String(platform || "Instagram");
  const total = toNumber(totalUsers);
  const completed = toNumber(completedCount);
  const partial = toNumber(partialCount);
  const notStarted = toNumber(notStartedCount);
  const missingUsername = toNumber(missingUsernameCount);
  const activeUsers = Math.max(total - missingUsername, 0);
  const actionNeeded = partial + notStarted;
  const nonCompliantRate = activeUsers > 0 ? (actionNeeded / activeUsers) * 100 : 0;
  const completedRate = Number.isFinite(complianceRate)
    ? complianceRate
    : activeUsers > 0
      ? (completed / activeUsers) * 100
      : 0;

  const alerts = [];

  if (notStarted > 0) {
    alerts.push({
      id: "not-started",
      level: notStarted >= 8 ? "high" : "medium",
      title: `${notStarted} akun belum mulai`,
      detail: `${notStarted} akun belum melakukan aktivitas ${platformLabel.toLowerCase()} pada ${periodLabel}. Ini risiko paling dekat untuk briefing berikutnya.`,
      action: "Dorong follow-up ke akun yang belum mulai lebih dulu.",
    });
  }

  if (partial > 0) {
    alerts.push({
      id: "partial",
      level: partial >= 6 ? "high" : "medium",
      title: `${partial} akun masih kurang lengkap`,
      detail: `${partial} akun sudah bergerak tapi belum memenuhi target ${platformLabel.toLowerCase()}.`,
      action: "Naikkan dari setengah jalan ke tuntas dengan pengingat terarah.",
    });
  }

  if (missingUsername > 0) {
    alerts.push({
      id: "missing-username",
      level: missingUsername >= 4 ? "medium" : "low",
      title: `${missingUsername} akun punya blindspot data`,
      detail: `${missingUsername} akun tanpa username belum ikut hitungan kepatuhan penuh.`,
      action: "Rapikan username agar monitoring dan eskalasi tidak bocor.",
    });
  }

  if (completedRate < 70) {
    alerts.push({
      id: "compliance",
      level: completedRate < 50 ? "high" : "medium",
      title: `Kepatuhan baru ${formatPercent(completedRate)}`,
      detail: `Tingkat kepatuhan aktif ${platformLabel.toLowerCase()} masih di bawah zona aman untuk ${periodLabel}.`,
      action: "Jadikan briefing harian sebagai alat kendali, bukan hanya rekap akhir.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "stable",
      level: "low",
      title: "Kondisi relatif aman",
      detail: `Belum ada sinyal risiko besar pada ${platformLabel.toLowerCase()} untuk ${periodLabel}.`,
      action: "Pertahankan ritme monitoring dan kebersihan data.",
    });
  }

  alerts.sort((a, b) => severityRank(b.level) - severityRank(a.level));

  const highestLevel = alerts[0]?.level || "low";
  const headline =
    highestLevel === "high"
      ? `${alerts.filter((item) => item.level === "high").length} alert prioritas perlu perhatian`
      : highestLevel === "medium"
        ? "Ada beberapa titik yang perlu dirapikan"
        : "Risk & compliance masih terkendali";

  return {
    tone: highestLevel,
    badge: "Risk & Compliance",
    title: `Alert Center ${platformLabel}`,
    description: `Ringkasan risiko operasional dari data ${platformLabel.toLowerCase()} untuk ${periodLabel}.`,
    summary: `${formatPercent(completedRate)} kepatuhan aktif • ${formatPercent(nonCompliantRate)} masih perlu aksi • ${missingUsername} blindspot username`,
    stateLabel: hasPremiumAccess ? "Premium active" : "Premium locked",
    stateHelper: hasPremiumAccess
      ? "Gunakan alert ini sebagai prioritas briefing dan kontrol eksekusi harian."
      : highestLevel === "high"
        ? "Aktifkan premium untuk dorong follow-up, briefing, dan rekap prioritas lebih cepat."
        : "Premium bisa membantu mengubah alert ini jadi alur briefing dan tindak lanjut yang lebih konsisten.",
    cta: hasPremiumAccess
      ? null
      : {
          label: highestLevel === "high" ? "Aktifkan premium sekarang" : "Lihat paket premium",
          href: premiumHref,
          tone: highestLevel,
        },
    alerts,
  };
}
