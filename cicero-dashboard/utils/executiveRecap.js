function formatPercent(value) {
  if (!Number.isFinite(value)) return '-';
  return `${Math.round(value)}%`;
}

function titleCase(value = '') {
  return String(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pickPrimaryRisk({ actionNeededCount, missingUsernameCount, complianceRate }) {
  if (actionNeededCount >= 10) return 'Perlu eskalasi cepat ke operator/satfung.';
  if (missingUsernameCount >= 5) return 'Rapikan username agar blindspot monitoring berkurang.';
  if (Number.isFinite(complianceRate) && complianceRate < 60) return 'Fokuskan follow-up pada personel yang belum mulai.';
  return 'Pertahankan ritme briefing agar capaian tetap stabil.';
}

export function buildExecutiveRecap({
  platform = 'Instagram',
  mode = 'brief',
  clientName = 'Client',
  periodLabel = 'Hari ini',
  totalUsers = 0,
  totalPosts = 0,
  completedCount = 0,
  partialCount = 0,
  notStartedCount = 0,
  missingUsernameCount = 0,
  complianceRate,
}) {
  const platformLabel = String(platform || 'Instagram');
  const safeClient = titleCase(clientName || 'Client');
  const totalUsersNumber = Number(totalUsers) || 0;
  const totalPostsNumber = Number(totalPosts) || 0;
  const completed = Number(completedCount) || 0;
  const partial = Number(partialCount) || 0;
  const notStarted = Number(notStartedCount) || 0;
  const missingUsername = Number(missingUsernameCount) || 0;
  const actionNeeded = partial + notStarted;
  const formattedCompliance = formatPercent(complianceRate);
  const primaryRisk = pickPrimaryRisk({ actionNeededCount: actionNeeded, missingUsernameCount: missingUsername, complianceRate });

  const lines = [
    `*Briefing ${platformLabel}*`,
    `Periode: ${periodLabel}`,
    `Client: ${safeClient}`,
    '',
    `• Total personel terpantau: ${totalUsersNumber}`,
    `• Total konten/post: ${totalPostsNumber}`,
    `• Sudah lengkap: ${completed}`,
    `• Kurang lengkap: ${partial}`,
    `• Belum mulai: ${notStarted}`,
    `• Tanpa username: ${missingUsername}`,
    `• Kepatuhan aktif: ${formattedCompliance}`,
    '',
    '*Arah tindak lanjut:*',
    `• ${primaryRisk}`,
    actionNeeded > 0
      ? `• Prioritaskan ${actionNeeded} akun yang masih perlu aksi sebelum briefing berikutnya.`
      : '• Seluruh akun aktif sudah aman, lanjutkan monitoring rutin.',
  ];

  if (mode === 'full') {
    lines.push(
      '',
      '*Catatan pimpinan:*',
      missingUsername > 0
        ? `• Ada ${missingUsername} akun tanpa username yang belum masuk hitungan kepatuhan penuh.`
        : '• Data username sudah rapi, fokus dapat diarahkan ke eksekusi lapangan.',
      totalPostsNumber > 0
        ? `• Setiap briefing merangkum capaian terhadap ${totalPostsNumber} konten pada periode ini.`
        : '• Belum ada konten masuk pada periode ini, sehingga monitoring tetap bersifat persiapan.',
    );
  }

  return {
    title: `Briefing ${platformLabel} siap kirim`,
    description: `Narasi ${mode === 'full' ? 'lengkap' : 'ringkas'} untuk operator/pimpinan tanpa merakit ulang rekap manual.`,
    summary: actionNeeded > 0
      ? `${actionNeeded} akun masih perlu aksi pada ${periodLabel}.`
      : `Semua akun aktif untuk ${platformLabel.toLowerCase()} sudah aman pada ${periodLabel}.`,
    text: lines.join('\n'),
  };
}
