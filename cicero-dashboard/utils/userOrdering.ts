const BIDHUMAS_CLIENT_ID = "BIDHUMAS";
const BIDHUMAS_PRIORITY_USER_NAME = "KOMPOL DADANG WIDYO PRABOWO,S.I.K";

function normalizeClientId(clientId: unknown): string {
  return String(clientId || "").trim().toUpperCase();
}

function normalizeName(name: unknown): string {
  return String(name || "").trim().toUpperCase();
}

export function prioritizeUsersForClient<T extends { nama?: string; name?: string }>(
  users: T[],
  clientId: unknown,
): T[] {
  if (!Array.isArray(users) || users.length === 0) return users;

  const normalizedClientId = normalizeClientId(clientId);
  if (normalizedClientId !== BIDHUMAS_CLIENT_ID) return users;

  const targetIndex = users.findIndex(
    (user) => normalizeName(user?.nama || (user as any)?.name) === BIDHUMAS_PRIORITY_USER_NAME,
  );

  if (targetIndex <= 0) return users;

  const targetUser = users[targetIndex];
  const remaining = users.slice(0, targetIndex).concat(users.slice(targetIndex + 1));
  return [targetUser, ...remaining];
}

export const userOrderingConstants = {
  BIDHUMAS_CLIENT_ID,
  BIDHUMAS_PRIORITY_USER_NAME,
};
