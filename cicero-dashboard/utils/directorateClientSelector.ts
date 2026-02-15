// Utility functions for directorate client selector

export interface ClientOption {
  client_id: string;
  nama_client: string;
}

function isGenericDirectorateLabel(label: string): boolean {
  return label.toUpperCase().includes("DIREKTORAT");
}

function getClientId(user: Record<string, unknown>): string {
  return String(
    user.client_id || user.clientId || user.clientID || user.client || ""
  ).trim();
}

function getExplicitClientName(user: Record<string, unknown>): string {
  return String(user.nama_client || user.client_name || "").trim();
}

function isSpecificSatkerLabel(label: string): boolean {
  return label !== "" && !isGenericDirectorateLabel(label);
}

/**
 * Extract unique client options from users data for directorate scope
 * @param users Array of user records
 * @returns Array of unique client options sorted by name
 */
export function extractClientOptions(
  users: Array<Record<string, unknown>>
): ClientOption[] {
  const labelByClientId = new Map<string, string>();

  users.forEach((user) => {
    const clientId = getClientId(user);
    if (!clientId) return;

    const explicitName = getExplicitClientName(user);
    const nextLabel = isSpecificSatkerLabel(explicitName) ? explicitName : clientId;
    const currentLabel = labelByClientId.get(clientId);

    if (!currentLabel) {
      labelByClientId.set(clientId, nextLabel);
      return;
    }

    // Upgrade fallback label to explicit satker label when later payloads are more specific.
    if (
      currentLabel === clientId &&
      isSpecificSatkerLabel(explicitName)
    ) {
      labelByClientId.set(clientId, explicitName);
    }
  });

  const normalizedLabelUsage = new Map<string, number>();
  labelByClientId.forEach((label) => {
    const normalized = label.toLocaleLowerCase("id");
    normalizedLabelUsage.set(normalized, (normalizedLabelUsage.get(normalized) || 0) + 1);
  });

  const options = Array.from(labelByClientId.entries()).map(([client_id, baseLabel]) => {
    const hasDuplicateLabel =
      (normalizedLabelUsage.get(baseLabel.toLocaleLowerCase("id")) || 0) > 1;

    return {
      client_id,
      nama_client: hasDuplicateLabel ? `${baseLabel} (${client_id})` : baseLabel,
    };
  });

  // Sort by name
  return options.sort((a, b) =>
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
  if (!selectedClientId || selectedClientId === "") {
    return users;
  }

  return users.filter((u) => {
    const userClientId = String(
      u.client_id || u.clientId || u.clientID || u.client || ""
    ).trim();
    return userClientId === selectedClientId;
  });
}
