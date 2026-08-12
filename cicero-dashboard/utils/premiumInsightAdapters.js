function normalizeSeverity(value) {
  const level = String(value || '').toLowerCase();
  if (level === 'critical') return 'high';
  if (['high', 'medium', 'low'].includes(level)) return level;
  return 'low';
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapRiskSummaryToCardProps(response, { hasPremiumAccess = false, premiumHref = '/premium' } = {}) {
  if (!response || typeof response !== 'object') return null;

  const severity = normalizeSeverity(
    response.alerts?.find((item) => item?.severity)?.severity || response.severity || response.tone,
  );
  const complianceRate = toNumber(response.complianceRate, 0);
  const actionNeededRate = toNumber(response.actionNeededRate, 0);
  const missingUsernameCount = toNumber(response.missingUsernameCount, 0);

  return {
    badge: 'Risk & Compliance',
    title: `Alert Center ${response.platform === 'tiktok' ? 'TikTok' : 'Instagram'}`,
    description: `Ringkasan risiko operasional dari data ${response.platform || 'engagement'} untuk ${response.periodLabel || 'periode aktif'}.`,
    summary: `${Math.round(complianceRate)}% kepatuhan aktif • ${Math.round(actionNeededRate)}% masih perlu aksi • ${missingUsernameCount} blindspot username`,
    tone: severity,
    stateLabel: hasPremiumAccess ? 'Premium active' : 'Premium locked',
    stateHelper: hasPremiumAccess
      ? 'Data backend ini siap dipakai jadi dasar briefing dan kontrol harian.'
      : severity === 'high'
        ? 'Aktifkan premium untuk dorong follow-up dan briefing prioritas lebih cepat.'
        : 'Premium membantu mengubah alert ini jadi alur briefing yang lebih konsisten.',
    cta: hasPremiumAccess
      ? null
      : {
          label: severity === 'high' ? 'Aktifkan premium sekarang' : 'Lihat paket premium',
          href: premiumHref,
          tone: severity,
        },
    alerts: Array.isArray(response.alerts)
      ? response.alerts.map((alert, index) => ({
          id: alert.id || `alert-${index}`,
          level: normalizeSeverity(alert.severity || alert.level),
          title: alert.title || 'Alert',
          detail: alert.detail || '',
          action: alert.action || '',
        }))
      : [],
  };
}

const EXECUTIVE_STAT_KEYS = [
  'totalUsers',
  'totalPosts',
  'completedCount',
  'partialCount',
  'notStartedCount',
  'missingUsernameCount',
];

export function isExecutiveRecapStatsConsistent(stats, sourceStats) {
  if (!stats || typeof stats !== 'object') return false;

  const normalized = {};
  for (const key of EXECUTIVE_STAT_KEYS) {
    const value = Number(stats[key]);
    if (!Number.isFinite(value) || value < 0) return false;
    normalized[key] = value;
  }

  const activeUsers = normalized.totalUsers - normalized.missingUsernameCount;
  const categorizedUsers = normalized.completedCount + normalized.partialCount + normalized.notStartedCount;
  if (activeUsers < 0 || categorizedUsers !== activeUsers) return false;

  if (sourceStats && typeof sourceStats === 'object') {
    return EXECUTIVE_STAT_KEYS.every((key) => Number(sourceStats[key]) === normalized[key]);
  }

  return true;
}

export function mapExecutiveRecapToCardProps(response, { sourceStats, fallback } = {}) {
  if (!response || typeof response !== 'object') return null;

  if (!isExecutiveRecapStatsConsistent(response.stats, sourceStats)) {
    return fallback || null;
  }

  const summary = typeof response.summary === 'string' ? response.summary : '';
  const text = typeof response.text === 'string' ? response.text : '';

  if (!summary || !text) return fallback || null;

  return {
    title: `Briefing ${response.platform === 'tiktok' ? 'TikTok' : 'Instagram'} siap kirim`,
    description: 'Narasi backend siap pakai untuk operator/pimpinan tanpa merakit ulang rekap manual.',
    summary,
    briefText: text,
    fullText: text,
  };
}
