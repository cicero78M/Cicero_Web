// Utility functions for directorate client selector

export interface ClientOption {
  client_id: string;
  nama_client: string;
}

export interface ClientLabelResolverOptions {
  fallbackNameByClientId?: Record<string, string>;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isGenericDirectorateLabel(label: string): boolean {
  return label.toUpperCase().includes("DIREKTORAT");
}

export function normalizeClientId(user: Record<string, unknown> | null | undefined): string {
  const safeUser = toRecord(user);
  return String(
    safeUser.client_id || safeUser.clientId || safeUser.clientID || safeUser.client || ""
  ).trim();
}

function getRawClientName(user: Record<string, unknown>): string {
  const safeUser = toRecord(user);
  return String(safeUser.nama_client || safeUser.client_name || safeUser.client || "").trim();
}

function isSpecificSatkerLabel(label: string): boolean {
  return label !== "" && !isGenericDirectorateLabel(label);
}

export function resolveClientLabel(
  user: Record<string, unknown>,
  options: ClientLabelResolverOptions = {}
): string {
  const safeUser = toRecord(user);
  const clientId = normalizeClientId(safeUser);
  const rawName = getRawClientName(safeUser);
  const explicitName = isSpecificSatkerLabel(rawName) ? rawName : "";
  const fallbackByMap =
    clientId && options.fallbackNameByClientId
      ? String(options.fallbackNameByClientId[clientId] || "").trim()
      : "";
  const fallbackFromMap = isSpecificSatkerLabel(fallbackByMap)
    ? fallbackByMap
    : "";

  return explicitName || fallbackFromMap || clientId;
}

export function normalizeUsersWithClientLabel(
  users: Array<Record<string, unknown>>,
  options: ClientLabelResolverOptions = {}
): Array<Record<string, unknown>> {
  return users
    .map((user) => toRecord(user))
    .map((user) => ({
      ...user,
      nama_client: resolveClientLabel(user, options),
    }));
}

/**
 * Extract unique client options from users data for directorate scope
 * @param users Array of user records
 * @returns Array of unique client options sorted by name
 */
export function extractClientOptions(
  users: Array<Record<string, unknown>>,
  options: ClientLabelResolverOptions = {}
): ClientOption[] {
  const labelByClientId = new Map<string, string>();

  users.forEach((user) => {
    const safeUser = toRecord(user);
    const clientId = normalizeClientId(safeUser);
    if (!clientId) return;

    const nextLabel = resolveClientLabel(safeUser, options);
    const currentLabel = labelByClientId.get(clientId);

    if (!currentLabel) {
      labelByClientId.set(clientId, nextLabel);
      return;
    }

    if (currentLabel === clientId && nextLabel !== clientId) {
      labelByClientId.set(clientId, nextLabel);
    }
  });

  const normalizedLabelUsage = new Map<string, number>();
  labelByClientId.forEach((label) => {
    const normalized = label.toLocaleLowerCase("id");
    normalizedLabelUsage.set(normalized, (normalizedLabelUsage.get(normalized) || 0) + 1);
  });

  const extractedOptions = Array.from(labelByClientId.entries()).map(([client_id, baseLabel]) => {
    const hasDuplicateLabel =
      (normalizedLabelUsage.get(baseLabel.toLocaleLowerCase("id")) || 0) > 1;

    return {
      client_id,
      nama_client: hasDuplicateLabel ? `${baseLabel} (${client_id})` : baseLabel,
    };
  });

  // Sort by name
  return extractedOptions.sort((a, b) =>
    a.nama_client.localeCompare(b.nama_client, "id", { sensitivity: "base" })
  );
}

/**
 * Filter users by selected client_id
 * @param users Array of user records
 * @param selectedClientId The client_id to filter by (empty string means show all)
 * @returns Filtered array of users
 */
export function filterUsersByClientId(
  users: Array<Record<string, unknown>>,
  selectedClientId: string
): Array<Record<string, unknown>> {
  const safeUsers = Array.isArray(users)
    ? users
        .map((entry) => toRecord(entry))
        .filter((entry) => Object.keys(entry).length > 0)
    : [];

  if (!selectedClientId || selectedClientId === "") {
    return safeUsers;
  }

  return safeUsers.filter((u) => normalizeClientId(u) === selectedClientId);
}
