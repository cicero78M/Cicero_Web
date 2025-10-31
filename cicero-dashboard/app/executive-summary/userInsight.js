import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

const resolveActivityFlag = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    return value !== 0;
  }

  if (value == null) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const collapsedNormalized = normalized.replace(/[\s\W_]+/g, "");

  const positive = [
    "active",
    "aktif",
    "ya",
    "yes",
    "true",
    "1",
    "on",
    "enabled",
    "enable",
  ];

  const negative = [
    "inactive",
    "inaktif",
    "nonaktif",
    "non active",
    "tidak aktif",
    "0",
    "off",
    "disabled",
    "disable",
    "mati",
    "berhenti",
  ];

  if (positive.includes(normalized)) {
    return true;
  }

  if (negative.includes(normalized)) {
    return false;
  }

  if (collapsedNormalized && collapsedNormalized !== normalized) {
    if (positive.includes(collapsedNormalized)) {
      return true;
    }

    if (negative.includes(collapsedNormalized)) {
      return false;
    }
  }

  if (collapsedNormalized && negative.some((item) => collapsedNormalized.includes(item))) {
    return false;
  }

  if (negative.some((item) => normalized.includes(item))) {
    return false;
  }

  return null;
};

const resolveUserActivity = (entry) => {
  if (!entry || typeof entry !== "object") {
    return { active: true, explicit: false };
  }

  const candidates = [
    entry?.is_active,
    entry?.isActive,
    entry?.active,
    entry?.aktif,
    entry?.enabled,
    entry?.is_enabled,
    entry?.isEnabled,
    entry?.status,
    entry?.user_status,
    entry?.userStatus,
    entry?.status_keaktifan,
    entry?.statusKeaktifan,
    entry?.keaktifan,
  ];

  for (const candidate of candidates) {
    const resolved = resolveActivityFlag(candidate);
    if (resolved != null) {
      return { active: resolved, explicit: true };
    }
  }

  return { active: true, explicit: false };
};

const toTrimmedString = (value) => {
  if (value == null) {
    return "";
  }

  const stringified = String(value).trim();
  return stringified;
};

const normalizeAliasKey = (value) => {
  const trimmed = toTrimmedString(value);
  if (!trimmed) {
    return "";
  }
  return trimmed.toUpperCase();
};

const collectClientAliasInfo = (user) => {
  const idFields = [
    "client_id",
    "clientId",
    "clientID",
    "client",
    "id_client",
    "clientid",
    "idClient",
  ];
  const nameFields = [
    "nama_client",
    "client_name",
    "client",
    "namaClient",
    "clientName",
    "divisi",
    "satker",
    "satuan_kerja",
    "nama_satuan_kerja",
  ];

  const rawIds = new Set();
  const aliasKeys = new Set();
  let preferredName = "";

  idFields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(user ?? {}, field)) {
      return;
    }
    const rawValue = toTrimmedString(user?.[field]);
    if (!rawValue) {
      return;
    }
    rawIds.add(rawValue);
    aliasKeys.add(normalizeAliasKey(rawValue));
    const collapsed = normalizeAliasKey(rawValue).replace(/[^0-9A-Z]+/g, "");
    if (collapsed) {
      aliasKeys.add(collapsed);
    }
  });

  for (const field of nameFields) {
    if (!Object.prototype.hasOwnProperty.call(user ?? {}, field)) {
      continue;
    }
    const rawValue = toTrimmedString(user?.[field]);
    if (!rawValue) {
      continue;
    }
    if (!preferredName) {
      preferredName = rawValue;
    }
    aliasKeys.add(normalizeAliasKey(rawValue));
    const collapsed = normalizeAliasKey(rawValue).replace(/[^0-9A-Z]+/g, "");
    if (collapsed) {
      aliasKeys.add(collapsed);
    }
  }

  return {
    aliasKeys: Array.from(aliasKeys).filter(Boolean),
    rawClientIds: Array.from(rawIds).filter(Boolean),
    preferredName,
  };
};

const clampValue = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const parsePercent = (value) => {
  if (typeof value === "number") {
    return clampValue(value, 0, 100);
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9,.-]+/g, "").replace(/,/g, ".");
    const parsed = parseFloat(sanitized);
    return Number.isFinite(parsed) ? clampValue(parsed, 0, 100) : 0;
  }

  const coerced = Number(value);
  return Number.isFinite(coerced) ? clampValue(coerced, 0, 100) : 0;
};

export const formatNumber = (value, options = {}) => {
  const formatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  });
  return formatter.format(value ?? 0);
};

export const formatPercent = (value) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const fractionDigits = safeValue < 10 && safeValue > 0 ? 1 : 0;
  return `${formatNumber(safeValue, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  })}%`;
};

const beautifyDivisionName = (rawName) => {
  const cleaned = (rawName || "").toString().replace(/[_]+/g, " ").trim();
  if (!cleaned) {
    return "Unit Lainnya";
  }
  return cleaned
    .split(/\s+/)
    .map((segment) => {
      if (!segment) return segment;
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0) + segment.slice(1).toLowerCase();
    })
    .join(" ");
};

const shortenDivisionName = (name) => {
  const formatted = beautifyDivisionName(name);
  return formatted.length > 20 ? `${formatted.slice(0, 19)}…` : formatted;
};

const extractUserGroupInfo = (user) => {
  const candidateFields = [user?.client_id];

  for (const field of candidateFields) {
    if (typeof field === "string" && field.trim() !== "") {
      const label = field.trim();
      return {
        key: label.toUpperCase(),
        label,
      };
    }
  }

  const clientIdentifier =
    user?.client_id ?? user?.clientId ?? user?.clientID ?? user?.id;
  if (clientIdentifier) {
    const label = String(clientIdentifier).trim();
    return {
      key: label.toUpperCase(),
      label,
    };
  }

  return {
    key: "LAINNYA",
    label: "LAINNYA",
  };
};

const buildUserNarrative = ({
  totalUsers,
  bothCount,
  bothPercent,
  instagramPercent,
  tiktokPercent,
  onlyInstagramPercent,
  onlyTikTokPercent,
  nonePercent,
  bestDivision,
  lowestDivision,
  priorityDivisions = [],
}) => {
  if (!totalUsers) {
    return "Belum ada data pengguna yang dapat dianalisis. Minta pada satker untuk memperbarui direktori terlebih dahulu.";
  }

  const sentences = [];
  sentences.push(
    `Direktori saat ini memuat ${formatNumber(totalUsers, { maximumFractionDigits: 0 })} personil aktif.`,
  );

  if (bothCount > 0) {
    sentences.push(
      `${formatNumber(bothCount, { maximumFractionDigits: 0 })} personil (${formatPercent(
        bothPercent,
      )}) telah melengkapi data Instagram dan TikTok sekaligus sehingga absensi pada platform Instagram dan Tiktok berjalan mulus.`,
    );
  } else {
    sentences.push(
      `Belum ada personil yang melengkapi kedua akun sosial media sekaligus, sehingga perlu kampanye internal untuk melakukan update username pada Instagram dan Tiktok.`,
    );
  }

  const igVsTtGap = Math.abs(instagramPercent - tiktokPercent);
  if (igVsTtGap < 5) {
    sentences.push(
      `Kelengkapan akun Instagram (${formatPercent(instagramPercent)}) dan TikTok (${formatPercent(
        tiktokPercent,
      )}) sudah relatif seimbang, menandakan prosedur input berjalan konsisten.`,
    );
  } else if (instagramPercent > tiktokPercent) {
    sentences.push(
      `Instagram masih unggul dengan kelengkapan ${formatPercent(
        instagramPercent,
      )}, sementara TikTok berada di ${formatPercent(
        tiktokPercent,
      )}; dorong satker agar mengejar ketertinggalan dengan melakukan update username.`,
    );
  } else {
    sentences.push(
      `TikTok justru lebih siap (${formatPercent(
        tiktokPercent,
      )}) dibanding Instagram (${formatPercent(
        instagramPercent,
      )}); perlu penguatan dorongan update username.`,
    );
  }

  if (bestDivision) {
    sentences.push(
      `${beautifyDivisionName(
        bestDivision.displayName ?? bestDivision.division,
      )} menjadi Polres paling siap dengan kelengkapan rata-rata ${formatPercent(
        bestDivision.completionPercent,
      )} dan basis ${formatNumber(bestDivision.total, { maximumFractionDigits: 0 })} personil aktif.`,
    );
  }

  if (lowestDivision && lowestDivision.division !== bestDivision?.division) {
    sentences.push(
      `Pendampingan perlu difokuskan pada ${beautifyDivisionName(
        lowestDivision.displayName ?? lowestDivision.division,
      )} yang baru mencapai ${formatPercent(
        lowestDivision.completionPercent,
      )} rata-rata kelengkapan data username.`,
    );
  }

  if (nonePercent > 0) {
    sentences.push(
      `Dari total seluruh data personil yang sudah diinput, ${formatPercent(nonePercent)} personil belum melakukan update data username sama sekali.`,
    );
  } else if (onlyInstagramPercent > 0 || onlyTikTokPercent > 0) {
    sentences.push(
      `Sisanya tersebar pada personil yang baru melengkapi satu username (${formatPercent(
        onlyInstagramPercent + onlyTikTokPercent,
      )}); targetkan follow-up ringan agar profil mereka seratus persen siap.`,
    );
  }

  const actionableDivisions = priorityDivisions
    .filter((item) => Number.isFinite(item?.completion) && item.completion < 80)
    .slice(0, 3);

  if (actionableDivisions.length > 0) {
    const listFormatter = new Intl.ListFormat("id-ID", {
      style: "long",
      type: "conjunction",
    });
    const formattedTargets = listFormatter.format(
      actionableDivisions.map((item) => {
        const divisionName = item.fullDivision ?? beautifyDivisionName(item.division);
        return `${divisionName} (${formatPercent(item.completion)})`;
      }),
    );

    sentences.push(
      `Sebagai tindak lanjut, jadwalkan klinik data dan pengingat mingguan bersama ${formattedTargets} untuk mendorong peningkatan kelengkapan satker yang masih rendah.`,
    );
  }

  return sentences.join(" ");
};

export const compareDivisionByCompletion = (a, b) => {
  const completionA = parsePercent(a?.completionPercent);
  const completionB = parsePercent(b?.completionPercent);

  const completionDelta = completionB - completionA;
  if (Math.abs(completionDelta) > 0.0001) {
    return completionDelta;
  }

  const totalA = normalizeNumericInput(a?.total ?? 0);
  const totalB = normalizeNumericInput(b?.total ?? 0);

  if (totalB !== totalA) {
    return totalB - totalA;
  }

  const shareA = parsePercent(a?.sharePercent);
  const shareB = parsePercent(b?.sharePercent);

  if (shareB !== shareA) {
    return shareB - shareA;
  }

  const instagramFilledA = normalizeNumericInput(a?.instagramFilled ?? a?.igFilled ?? 0);
  const instagramFilledB = normalizeNumericInput(b?.instagramFilled ?? b?.igFilled ?? 0);

  if (instagramFilledB !== instagramFilledA) {
    return instagramFilledB - instagramFilledA;
  }

  const tiktokFilledA = normalizeNumericInput(a?.tiktokFilled ?? a?.ttFilled ?? 0);
  const tiktokFilledB = normalizeNumericInput(b?.tiktokFilled ?? b?.ttFilled ?? 0);

  if (tiktokFilledB !== tiktokFilledA) {
    return tiktokFilledB - tiktokFilledA;
  }

  const divisionA = typeof a?.division === "string" ? a.division : "";
  const divisionB = typeof b?.division === "string" ? b.division : "";

  return divisionA.localeCompare(divisionB, "id-ID", { sensitivity: "base" });
};

export const computeUserInsight = (users = []) => {
  const totalUsers = users.length;
  let instagramFilled = 0;
  let tiktokFilled = 0;
  let bothCount = 0;
  let onlyInstagram = 0;
  let onlyTikTok = 0;
  let none = 0;

  const divisionMap = new Map();
  const insightPersonnelAccumulator = new Map();

  users.forEach((user) => {
    const hasInstagram = Boolean(user?.insta && String(user.insta).trim() !== "");
    const hasTikTok = Boolean(user?.tiktok && String(user.tiktok).trim() !== "");

    const activityStatus = resolveUserActivity(user);

    if (hasInstagram) instagramFilled += 1;
    if (hasTikTok) tiktokFilled += 1;
    if (hasInstagram && hasTikTok) {
      bothCount += 1;
    } else if (hasInstagram) {
      onlyInstagram += 1;
    } else if (hasTikTok) {
      onlyTikTok += 1;
    } else {
      none += 1;
    }

    const { key: divisionKey, label: divisionLabel } = extractUserGroupInfo(user);

    const { aliasKeys, rawClientIds, preferredName } = collectClientAliasInfo(user);
    const canonicalKey = divisionKey || "LAINNYA";
    const displayName = preferredName || divisionLabel || canonicalKey;

    if (!insightPersonnelAccumulator.has(canonicalKey)) {
      insightPersonnelAccumulator.set(canonicalKey, {
        key: canonicalKey,
        label: displayName,
        total: 0,
        active: 0,
        inactive: 0,
        aliasSet: new Set(),
        rawClientIdSet: new Set(),
        hasExplicitActive: false,
      });
    }

    const personnelRecord = insightPersonnelAccumulator.get(canonicalKey);
    personnelRecord.total += 1;
    if (activityStatus.active) {
      personnelRecord.active += 1;
    } else {
      personnelRecord.inactive += 1;
    }
    if (activityStatus.explicit) {
      personnelRecord.hasExplicitActive = true;
    }

    personnelRecord.aliasSet.add(canonicalKey);
    const normalizedDivisionLabel = normalizeAliasKey(divisionLabel);
    if (normalizedDivisionLabel) {
      personnelRecord.aliasSet.add(normalizedDivisionLabel);
    }
    aliasKeys.forEach((alias) => {
      if (alias) {
        personnelRecord.aliasSet.add(alias);
      }
    });
    rawClientIds.forEach((clientId) => {
      personnelRecord.rawClientIdSet.add(clientId);
    });

    if (displayName && displayName !== personnelRecord.label) {
      personnelRecord.label = displayName;
    }

    if (!divisionMap.has(divisionKey)) {
      divisionMap.set(divisionKey, {
        division: divisionKey,
        displayName: divisionLabel,
        total: 0,
        igFilled: 0,
        ttFilled: 0,
      });
    }

    const record = divisionMap.get(divisionKey);
    record.total += 1;
    if (hasInstagram) record.igFilled += 1;
    if (hasTikTok) record.ttFilled += 1;
  });

  const instagramPercent = totalUsers ? (instagramFilled / totalUsers) * 100 : 0;
  const tiktokPercent = totalUsers ? (tiktokFilled / totalUsers) * 100 : 0;
  const bothPercent = totalUsers ? (bothCount / totalUsers) * 100 : 0;
  const onlyInstagramPercent = totalUsers ? (onlyInstagram / totalUsers) * 100 : 0;
  const onlyTikTokPercent = totalUsers ? (onlyTikTok / totalUsers) * 100 : 0;
  const nonePercent = totalUsers ? (none / totalUsers) * 100 : 0;

  const divisionArray = Array.from(divisionMap.values()).map((item) => {
    const igPercent = item.total ? (item.igFilled / item.total) * 100 : 0;
    const tiktokPercentDivision = item.total ? (item.ttFilled / item.total) * 100 : 0;
    const completionPercent = item.total
      ? ((item.igFilled + item.ttFilled) / (item.total * 2)) * 100
      : 0;
    return {
      ...item,
      displayName: item.displayName ?? item.division,
      igPercent,
      tiktokPercent: tiktokPercentDivision,
      completionPercent,
    };
  });

  const sortedByTotal = [...divisionArray].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return b.completionPercent - a.completionPercent;
  });

  const completionBarData = sortedByTotal.slice(0, 5).map((item) => ({
    division: shortenDivisionName(item.displayName ?? item.division),
    fullDivision: beautifyDivisionName(item.displayName ?? item.division),
    completion: Number(item.completionPercent.toFixed(1)),
    instagram: Number(item.igPercent.toFixed(1)),
    tiktok: Number(item.tiktokPercent.toFixed(1)),
    total: item.total,
  }));

  const lowestCompletionDivisions = divisionArray
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      if (a.completionPercent !== b.completionPercent) {
        return a.completionPercent - b.completionPercent;
      }
      if (a.total !== b.total) {
        return a.total - b.total;
      }
      return beautifyDivisionName(a.displayName ?? a.division).localeCompare(
        beautifyDivisionName(b.displayName ?? b.division),
        "id-ID",
        { sensitivity: "base" },
      );
    })
    .slice(0, 10)
    .map((item) => ({
      division: shortenDivisionName(item.displayName ?? item.division),
      fullDivision: beautifyDivisionName(item.displayName ?? item.division),
      completion: Number(item.completionPercent.toFixed(1)),
      instagram: Number(item.igPercent.toFixed(1)),
      tiktok: Number(item.tiktokPercent.toFixed(1)),
      total: item.total,
    }));

  const bestDivision = [...divisionArray]
    .sort((a, b) => {
      if (b.completionPercent !== a.completionPercent) {
        return b.completionPercent - a.completionPercent;
      }
      return b.total - a.total;
    })
    .find((item) => item.total > 0);

  const lowestDivision = [...divisionArray]
    .sort((a, b) => {
      if (a.completionPercent !== b.completionPercent) {
        return a.completionPercent - b.completionPercent;
      }
      return b.total - a.total;
    })
    .find((item) => item.total > 0);

  const pieData = [
    { name: "IG & TikTok Lengkap", value: bothCount },
    { name: "Hanya IG", value: onlyInstagram },
    { name: "Hanya TikTok", value: onlyTikTok },
    { name: "Belum Diisi", value: none },
  ];

  const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const sortedByDivisionSize = [...divisionArray].sort((a, b) => b.total - a.total);
  const sortedByCompletion = [...divisionArray].sort(compareDivisionByCompletion);
  const divisionDistribution = sortedByCompletion.map((item, index) => ({
    id: item.division ?? `division-${index}`,
    rank: index + 1,
    division: beautifyDivisionName(item.displayName ?? item.division),
    total: item.total,
    instagramFilled: item.igFilled,
    instagramPercent: Number(item.igPercent.toFixed(1)),
    tiktokFilled: item.ttFilled,
    tiktokPercent: Number(item.tiktokPercent.toFixed(1)),
    completionPercent: Number(item.completionPercent.toFixed(1)),
    sharePercent: totalUsers
      ? Number(((item.total / totalUsers) * 100).toFixed(1))
      : 0,
  }));
  const topDivisionCount = 6;
  const topDivisions = sortedByDivisionSize.slice(0, topDivisionCount);
  const remainingDivisions = sortedByDivisionSize.slice(topDivisionCount);

  const divisionComposition = topDivisions.map((item) => ({
    name: beautifyDivisionName(item.displayName ?? item.division),
    value: item.total,
  }));

  const remainingTotal = remainingDivisions.reduce((acc, item) => acc + item.total, 0);
  if (remainingTotal > 0) {
    divisionComposition.push({
      name: "Satker Lainnya",
      value: remainingTotal,
    });
  }

  const divisionCompositionTotal = divisionComposition.reduce(
    (acc, item) => acc + item.value,
    0,
  );

  const personnelByClient = new Map();
  let aggregatedActiveUsers = 0;
  let summaryActiveUsers = 0;

  insightPersonnelAccumulator.forEach((record, key) => {
    const aliasKeys = Array.from(record.aliasSet).filter(Boolean);
    const rawClientIds = Array.from(record.rawClientIdSet).filter(Boolean);
    const sanitizedTotal = Number.isFinite(record.total) ? record.total : 0;
    const sanitizedActive = Number.isFinite(record.active) ? record.active : 0;

    summaryActiveUsers += sanitizedActive;
    if (record.hasExplicitActive) {
      aggregatedActiveUsers += sanitizedActive;
    }

    personnelByClient.set(key, {
      key,
      label: record.label || key,
      totalPersonnel: sanitizedTotal,
      activePersonnel: sanitizedActive,
      inactivePersonnel: Number.isFinite(record.inactive) ? record.inactive : 0,
      aliasKeys,
      rawClientIds,
      hasExplicitActive: record.hasExplicitActive,
    });
  });

  const totalActiveUsers = summaryActiveUsers;
  const explicitActiveUsers = aggregatedActiveUsers;
  const totalInactiveUsers = Math.max(totalUsers - totalActiveUsers, 0);

  const priorityDivisions = lowestCompletionDivisions
    .filter((item) => Number.isFinite(item?.completion))
    .slice(0, 5);

  const narrative = buildUserNarrative({
    totalUsers,
    bothCount,
    bothPercent,
    instagramPercent,
    tiktokPercent,
    onlyInstagramPercent,
    onlyTikTokPercent,
    nonePercent,
    bestDivision,
    lowestDivision,
    priorityDivisions,
  });

  return {
    summary: {
      totalUsers,
      activeUsers: totalActiveUsers,
      explicitActiveUsers,
      inactiveUsers: totalInactiveUsers,
      instagramFilled,
      instagramPercent,
      tiktokFilled,
      tiktokPercent,
      bothCount,
      bothPercent,
    },
    completionBarData,
    lowestCompletionDivisions,
    pieData,
    pieTotal,
    divisionComposition,
    divisionCompositionTotal,
    divisionDistribution,
    narrative,
    personnelByClient,
  };
};
