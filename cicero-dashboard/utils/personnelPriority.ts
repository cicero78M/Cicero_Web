export interface PersonnelPriorityPattern {
  canonicalName: string;
  tokens: string[];
  aliases: string[];
}

const NAME_FIELDS = [
  "nama",
  "name",
  "fullName",
  "full_name",
  "displayName",
  "display_name",
  "username",
];

export const PERSONNEL_PRIORITY_PATTERNS: PersonnelPriorityPattern[] = [
  {
    canonicalName: "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H.",
    tokens: ["LAFRI", "PRASETYONO"],
    aliases: [
      "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H.",
      "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H",
      "KOMBES POL LAFRI PRASETYONO",
      "KOMBESPOL LAFRI PRASETYONO",
      "KOMBES POL. LAFRI PRASETYONO",
    ],
  },
  {
    canonicalName: "AKBP ARY MURTINI, S.I.K., M.Si.",
    tokens: ["ARY", "MURTINI"],
    aliases: [
      "AKBP ARY MURTINI, S.I.K., M.SI.",
      "AKBP ARY MURTINI",
      "AKBP ARY MURTINI SIK",
    ],
  },
  {
    canonicalName: "AKBP DEDY SUPRIYADI, S.I.K.",
    tokens: ["DEDY", "SUPRIYADI"],
    aliases: [
      "AKBP DEDY SUPRIYADI, S.I.K.",
      "AKBP DEDY SUPRIYADI",
      "AKBP DEDI SUPRIADI",
    ],
  },
  {
    canonicalName: "AKBP ROBERTUS RIYANTO, S.I.K., M.Si.",
    tokens: ["ROBERTUS", "RIYANTO"],
    aliases: [
      "AKBP ROBERTUS RIYANTO, S.I.K., M.SI.",
      "AKBP ROBERTUS RIYANTO",
      "AKBP ROB RIYANTO",
    ],
  },
  {
    canonicalName: "AKBP HERU PRAKOSO, S.H., M.H.",
    tokens: ["HERU", "PRAKOSO"],
    aliases: [
      "AKBP HERU PRAKOSO, S.H., M.H.",
      "AKBP HERU PRAKOSO",
      "AKBP HERU PRAKOSO SH MH",
    ],
  },
  {
    canonicalName: "AKBP MOH. ANWAR NUGROHO, S.I.K., M.H.",
    tokens: ["ANWAR", "NUGROHO"],
    aliases: [
      "AKBP MOH. ANWAR NUGROHO, S.I.K., M.H.",
      "AKBP MOH ANWAR NUGROHO",
      "AKBP ANWAR NUGROHO",
    ],
  },
  {
    canonicalName: "AKBP BUDI PRASETYO, S.I.K.",
    tokens: ["BUDI", "PRASETYO"],
    aliases: [
      "AKBP BUDI PRASETYO, S.I.K.",
      "AKBP BUDI PRASETYO",
      "AKBP BUDI PRASETIO",
    ],
  },
  {
    canonicalName: "AKBP HARTONO, S.H.",
    tokens: ["HARTONO"],
    aliases: [
      "AKBP HARTONO, S.H.",
      "AKBP HARTONO",
      "AKBP H. HARTONO",
    ],
  },
  {
    canonicalName: "AKBP DWI LISTYOWATI, S.I.K.",
    tokens: ["DWI", "LISTYOWATI"],
    aliases: [
      "AKBP DWI LISTYOWATI, S.I.K.",
      "AKBP DWI LISTYOWATI",
      "AKBP DWI LISTYOWATI SIK",
    ],
  },
  {
    canonicalName: "AKBP RUDI SETIAWAN, S.I.K., M.H.",
    tokens: ["RUDI", "SETIAWAN"],
    aliases: [
      "AKBP RUDI SETIAWAN, S.I.K., M.H.",
      "AKBP RUDI SETIAWAN",
      "AKBP RUDI SETIAWAN SIK",
    ],
  },
  {
    canonicalName: "AKBP WAHYU DARMADI, S.I.K.",
    tokens: ["WAHYU", "DARMADI"],
    aliases: [
      "AKBP WAHYU DARMADI, S.I.K.",
      "AKBP WAHYU DARMADI",
      "AKBP WAHYU DARMADI SIK",
    ],
  },
  {
    canonicalName: "AKBP ADITYA BASKORO, S.I.K.",
    tokens: ["ADITYA", "BASKORO"],
    aliases: [
      "AKBP ADITYA BASKORO, S.I.K.",
      "AKBP ADITYA BASKORO",
      "AKBP ADITYA BASKORO SIK",
    ],
  },
  {
    canonicalName: "AKBP EKO CAHYONO, S.I.K.",
    tokens: ["EKO", "CAHYONO"],
    aliases: [
      "AKBP EKO CAHYONO, S.I.K.",
      "AKBP EKO CAHYONO",
      "AKBP EKO CAHYONO SIK",
    ],
  },
];

const sanitizeTokens = (tokens: string[]): string[] =>
  tokens
    .map((token) => token.replace(/[^A-Z0-9]/g, "").trim())
    .filter(Boolean);

const sanitizedPatterns = PERSONNEL_PRIORITY_PATTERNS.map((pattern) => ({
  ...pattern,
  sanitizedTokens: sanitizeTokens(pattern.tokens),
  sanitizedAliases: pattern.aliases.map((alias) =>
    sanitizePersonnelName(alias).replace(/\s+/g, ""),
  ),
}));

export function normalizePersonnelName(value: unknown): string {
  if (typeof value === "string") {
    return value.replace(/\s+/g, " ").trim().toUpperCase();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  for (const field of NAME_FIELDS) {
    const fieldValue = (value as Record<string, unknown>)[field];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return fieldValue.replace(/\s+/g, " ").trim().toUpperCase();
    }
  }

  return "";
}

export function sanitizePersonnelName(value: unknown): string {
  return normalizePersonnelName(value)
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPersonnelPriorityIndex(value: unknown): number {
  const normalized = normalizePersonnelName(value);
  if (!normalized) {
    return Number.POSITIVE_INFINITY;
  }

  const sanitizedWithSpaces = sanitizePersonnelName(normalized);
  const condensed = sanitizedWithSpaces.replace(/\s+/g, "");

  for (let index = 0; index < sanitizedPatterns.length; index += 1) {
    const pattern = sanitizedPatterns[index];

    const aliasMatch = pattern.sanitizedAliases.some((alias) =>
      condensed.includes(alias),
    );

    if (aliasMatch) {
      return index;
    }

    const tokensMatch = pattern.sanitizedTokens.every((token) =>
      token ? condensed.includes(token) : false,
    );

    if (tokensMatch) {
      return index;
    }
  }

  return Number.POSITIVE_INFINITY;
}
