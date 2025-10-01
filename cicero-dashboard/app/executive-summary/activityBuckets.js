import { normalizeFormattedNumber } from "@/lib/normalizeNumericInput";

const extractNumericValue = (...candidates) => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    if (Array.isArray(candidate)) {
      return candidate.length;
    }

    if (typeof candidate === "number") {
      if (Number.isFinite(candidate)) {
        return candidate;
      }
      continue;
    }

    const normalized = normalizeFormattedNumber(candidate);
    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    if (
      typeof candidate === "object" &&
      candidate !== null &&
      "value" in candidate
    ) {
      const nested = Number(candidate.value);
      if (Number.isFinite(nested)) {
        return nested;
      }
    }
  }

  return 0;
};

const normalizeLookupKey = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim().toLowerCase();
};

const participantIdentifierFields = {
  id: ["user_id", "userId", "id", "nrp", "nip", "personil_id", "nip_nrp"],
  username: [
    "username",
    "user_name",
    "insta",
    "instagram",
    "tiktok",
    "tiktok_username",
  ],
  name: ["nama", "name", "full_name"],
};

const participantCopyFields = [
  ...participantIdentifierFields.id,
  ...participantIdentifierFields.username,
  ...participantIdentifierFields.name,
];

const mergeParticipantData = (target, source) => {
  if (!source) {
    return target;
  }

  participantCopyFields.forEach((field) => {
    if (target[field] === undefined && source?.[field] !== undefined) {
      target[field] = source[field];
    }
  });

  return target;
};

const buildParticipantKey = (source, fallbackKey = "") => {
  if (source) {
    for (const [prefix, fields] of Object.entries(participantIdentifierFields)) {
      for (const field of fields) {
        const normalized = normalizeLookupKey(source?.[field]);
        if (normalized) {
          return `${prefix}:${normalized}`;
        }
      }
    }
  }

  return fallbackKey || null;
};

const buildParticipantMap = (users = [], likes = [], comments = []) => {
  const participants = new Map();

  const ensureParticipant = (source, fallbackKey) => {
    if (!source) {
      return;
    }

    const key = buildParticipantKey(source, fallbackKey);
    if (!key) {
      return;
    }

    const existing = participants.get(key) || {};
    mergeParticipantData(existing, source);
    participants.set(key, existing);
  };

  users.forEach((user, index) => ensureParticipant(user, `user:${index}`));
  likes.forEach((record, index) => ensureParticipant(record, `like:${index}`));
  comments.forEach((record, index) => ensureParticipant(record, `comment:${index}`));

  return participants;
};

const createActivityLookup = (records = [], countFields = []) => {
  const map = new Map();
  const addKey = (prefix, rawValue, count) => {
    const normalized = normalizeLookupKey(rawValue);
    if (!normalized) {
      return;
    }
    const key = `${prefix}:${normalized}`;
    if (map.has(key)) {
      map.set(key, Math.max(map.get(key), count));
    } else {
      map.set(key, count);
    }
  };

  records.forEach((record) => {
    const count = extractNumericValue(
      ...countFields.map((field) => record?.[field]),
    );
    if (!Number.isFinite(count) || count < 0) {
      return;
    }

    const usernameFields = [
      "username",
      "user_name",
      "insta",
      "instagram",
      "tiktok",
      "tiktok_username",
    ];
    const idFields = [
      "user_id",
      "userId",
      "id",
      "nrp",
      "nip",
      "personil_id",
      "nip_nrp",
    ];
    const nameFields = ["nama", "name", "full_name"];

    usernameFields.forEach((field) => addKey("username", record?.[field], count));
    idFields.forEach((field) => addKey("id", record?.[field], count));
    nameFields.forEach((field) => addKey("name", record?.[field], count));
  });

  return map;
};

const getCountForUser = (lookup, user) => {
  if (!(lookup instanceof Map) || lookup.size === 0 || !user) {
    return 0;
  }

  const tried = new Set();
  const tryValue = (prefix, rawValue) => {
    const normalized = normalizeLookupKey(rawValue);
    if (!normalized) {
      return undefined;
    }
    const key = `${prefix}:${normalized}`;
    if (tried.has(key)) {
      return undefined;
    }
    tried.add(key);
    if (lookup.has(key)) {
      return lookup.get(key);
    }
    return undefined;
  };

  const usernameFields = [
    "username",
    "user_name",
    "insta",
    "instagram",
    "tiktok",
    "tiktok_username",
  ];
  const idFields = [
    "user_id",
    "userId",
    "id",
    "nrp",
    "nip",
    "personil_id",
    "nip_nrp",
  ];
  const nameFields = ["nama", "name", "full_name"];

  for (const field of usernameFields) {
    const result = tryValue("username", user?.[field]);
    if (result !== undefined) {
      return result;
    }
  }

  for (const field of idFields) {
    const result = tryValue("id", user?.[field]);
    if (result !== undefined) {
      return result;
    }
  }

  for (const field of nameFields) {
    const result = tryValue("name", user?.[field]);
    if (result !== undefined) {
      return result;
    }
  }

  return 0;
};

const computeActivityBuckets = ({
  users = [],
  likes = [],
  comments = [],
  totalIGPosts = 0,
  totalTikTokPosts = 0,
}) => {
  const likesLookup = createActivityLookup(likes, [
    "jumlah_like",
    "jumlahLike",
    "total_like",
    "totalLikes",
    "likes",
    "like_count",
  ]);
  const commentsLookup = createActivityLookup(comments, [
    "jumlah_komentar",
    "jumlahKomentar",
    "total_komentar",
    "komentar",
    "comments",
    "comment_count",
  ]);

  const safeIGPosts = Math.max(0, Number(totalIGPosts) || 0);
  const safeTikTokPosts = Math.max(0, Number(totalTikTokPosts) || 0);
  const totalContent = safeIGPosts + safeTikTokPosts;

  const participantMap = buildParticipantMap(users, likes, comments);
  const participants = Array.from(participantMap.values());

  let mostActive = 0;
  let moderate = 0;
  let low = 0;
  let zero = 0;
  const evaluatedUsers = participants.length;

  participants.forEach((participant) => {
    const likeCount = getCountForUser(likesLookup, participant);
    const commentCount = getCountForUser(commentsLookup, participant);
    const hasAction = likeCount > 0 || commentCount > 0;

    if (!hasAction) {
      zero += 1;
      return;
    }

    let numerator = 0;
    let denominator = 0;

    if (safeIGPosts > 0) {
      denominator += safeIGPosts;
      numerator += Math.min(likeCount, safeIGPosts);
    }

    if (safeTikTokPosts > 0) {
      denominator += safeTikTokPosts;
      numerator += Math.min(commentCount, safeTikTokPosts);
    }

    const ratio = denominator > 0 ? numerator / denominator : 1;
    const clampedRatio = Math.max(0, Math.min(ratio, 1));

    if (clampedRatio >= 0.9) {
      mostActive += 1;
    } else if (clampedRatio >= 0.5) {
      moderate += 1;
    } else {
      low += 1;
    }
  });

  return {
    totalUsers: participants.length,
    evaluatedUsers,
    totalContent,
    categories: [
      {
        key: "most-active",
        label: "Paling Aktif",
        description: "Likes & komentar > 90% konten",
        count: mostActive,
      },
      {
        key: "moderate",
        label: "Aktivitas Sedang",
        description: "Likes & komentar 50-90% konten",
        count: moderate,
      },
      {
        key: "low",
        label: "Aktivitas Rendah",
        description: "Likes & komentar 0-50% konten",
        count: low,
      },
      {
        key: "inactive",
        label: "Tanpa Aktivitas",
        description: "Belum melakukan likes/komentar",
        count: zero,
      },
    ],
  };
};

export { computeActivityBuckets, extractNumericValue };
