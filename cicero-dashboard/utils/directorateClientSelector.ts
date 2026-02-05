// Utility functions for directorate client selector

export interface ClientOption {
  client_id: string;
  nama_client: string;
}

/**
 * Extract unique client options from users data for directorate scope
 * @param users Array of user records
 * @returns Array of unique client options sorted by name
 */
export function extractClientOptions(
  users: Array<Record<string, unknown>>
): ClientOption[] {
  const clientMap = new Map<string, string>();

  users.forEach((u) => {
    const id = String(
      u.client_id || u.clientId || u.clientID || u.client || ""
    ).trim();
    
    if (!id) return;

    const name = String(
      u.nama_client || u.client_name || u.client || id
    ).trim();

    if (!clientMap.has(id)) {
      clientMap.set(id, name);
    }
  });

  const options = Array.from(clientMap.entries()).map(([client_id, nama_client]) => ({
    client_id,
    nama_client,
  }));

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
