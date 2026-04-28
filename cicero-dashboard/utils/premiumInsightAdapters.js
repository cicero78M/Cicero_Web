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

export function mapExecutiveRecapToCardProps(response) {
  if (!response || typeof response !== 'object') return null;

  const summary = typeof response.summary === 'string' ? response.summary : '';
  const text = typeof response.text === 'string' ? response.text : '';

  return {
    title: `Briefing ${response.platform === 'tiktok' ? 'TikTok' : 'Instagram'} siap kirim`,
    description: 'Narasi backend siap pakai untuk operator/pimpinan tanpa merakit ulang rekap manual.',
    summary,
    briefText: text,
    fullText: text,
  };
}
