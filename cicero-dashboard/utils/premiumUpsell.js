function formatPercent(value) {
  if (!Number.isFinite(value)) return null;
  return `${Math.round(value)}%`;
}

function clampNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function resolveUrgencyTone({ actionNeededCount, missingUsernameCount, complianceRate }) {
  if (actionNeededCount >= 10 || missingUsernameCount >= 5) return 'critical';
  if (actionNeededCount >= 4 || missingUsernameCount >= 2) return 'warning';
  if (Number.isFinite(complianceRate) && complianceRate < 50) return 'warning';
  return 'opportunity';
}

export function buildEngagementPremiumUpsell({
  platform = 'engagement',
  hasPremiumAccess = false,
  isOrgClient = false,
  isOrgOperator = false,
  periodLabel = 'hari ini',
  totalUsers = 0,
  completedCount = 0,
  actionNeededCount = 0,
  notStartedCount = 0,
  missingUsernameCount = 0,
  totalPosts = 0,
  complianceRate,
  premiumHref = '/premium',
}) {
  if (!isOrgClient || isOrgOperator || hasPremiumAccess) {
    return { premiumCta: null, premiumProof: null };
  }

  const normalizedPlatform = String(platform || 'engagement').toLowerCase();
  const platformLabel = normalizedPlatform === 'tiktok' ? 'komentar TikTok' : 'likes Instagram';
  const urgency = resolveUrgencyTone({ actionNeededCount, missingUsernameCount, complianceRate });
  const totalUsersNumber = clampNumber(totalUsers);
  const completedNumber = clampNumber(completedCount);
  const actionNeededNumber = clampNumber(actionNeededCount);
  const notStartedNumber = clampNumber(notStartedCount);
  const missingUsernameNumber = clampNumber(missingUsernameCount);
  const totalPostsNumber = clampNumber(totalPosts);
  const formattedCompliance = formatPercent(complianceRate);
  const estimatedManualFollowUps = actionNeededNumber + missingUsernameNumber;
  const recommendedBriefings = actionNeededNumber > 0 ? 2 : 1;

  let label = 'Aktifkan Premium CICERO';
  let description = `Jadwalkan rekap otomatis dan briefing WA Bot ${platformLabel} tiap hari.`;
  let actionLabel = 'Lihat Paket';

  if (urgency === 'critical') {
    label = `${estimatedManualFollowUps} akun perlu tindak lanjut`;
    description = `Premium bantu susun rekap prioritas ${platformLabel} dan briefing WA untuk ${periodLabel}.`;
    actionLabel = 'Aktifkan';
  } else if (urgency === 'warning') {
    label = `Masih ada gap ${platformLabel}`;
    description = `Gunakan premium untuk mengejar ${actionNeededNumber} akun yang belum aman sebelum briefing berikutnya.`;
    actionLabel = 'Coba Premium';
  } else if (formattedCompliance) {
    label = `Naikkan kepatuhan dari ${formattedCompliance}`;
    description = `Premium bantu operator merapikan rekap ${platformLabel} dan follow-up lebih cepat.`;
    actionLabel = 'Upgrade';
  }

  const primaryMetricLabel = normalizedPlatform === 'tiktok' ? 'Akun belum komentar' : 'Akun belum likes';

  const ctaTone = urgency === 'critical' ? 'critical' : urgency === 'warning' ? 'warning' : 'default';

  return {
    premiumCta: {
      label,
      description,
      href: premiumHref,
      actionLabel,
      tone: ctaTone,
    },
    premiumProof: {
      badge: 'Proof of Value',
      title: `Apa yang bisa dihemat jika ${platformLabel} dibuat premium?`,
      description:
        estimatedManualFollowUps > 0
          ? `${estimatedManualFollowUps} akun masih butuh sentuhan manual pada ${periodLabel}. Premium membantu operator menyusun briefing dan rekap tindak lanjut tanpa merakit ulang data.`
          : `Kepatuhan ${platformLabel} sudah mulai rapi. Premium menjaga ritme itu lewat briefing WA dan rekap otomatis yang konsisten.`,
      tone: urgency,
      stateLabel: 'Premium locked',
      stateHelper:
        urgency === 'critical'
          ? 'Ada pekerjaan follow-up yang masih manual dan berisiko telat dibawa ke briefing.'
          : urgency === 'warning'
            ? 'Otomasi premium bisa membantu menutup gap kepatuhan lebih cepat.'
            : 'Aktifkan premium untuk menjaga ritme rekap dan briefing tetap konsisten.',
      metrics: [
        {
          label: primaryMetricLabel,
          value: actionNeededNumber,
          helper: notStartedNumber > 0 ? `${notStartedNumber} benar-benar belum mulai` : 'Perlu follow-up',
        },
        {
          label: 'Kepatuhan aktif',
          value: formattedCompliance || '-',
          helper: `${completedNumber} dari ${Math.max(totalUsersNumber - missingUsernameNumber, 0)} akun aktif`,
        },
        {
          label: 'Rekap yang bisa diotomatisasi',
          value: recommendedBriefings,
          helper: 'briefing WA per hari',
        },
      ],
      bullets: [
        `${estimatedManualFollowUps} follow-up manual bisa dipersempit jadi daftar prioritas siap kirim.`,
        totalPostsNumber > 0
          ? `Rekap ${platformLabel} untuk ${totalPostsNumber} post dapat dibungkus jadi briefing WA siap tempel.`
          : `Begitu post masuk, premium bisa langsung menyiapkan alur briefing dan rekapnya.`,
        missingUsernameNumber > 0
          ? `${missingUsernameNumber} akun tanpa username bisa ikut terangkat sebagai blindspot data yang perlu dibereskan.`
          : 'Tidak ada blindspot username besar, jadi premium bisa fokus ke kontrol eksekusi tim.',
      ],
      cta: {
        label: urgency === 'critical' ? 'Aktifkan untuk prioritas ini' : 'Lihat paket premium',
        href: premiumHref,
        tone: ctaTone,
      },
    },
  };
}
