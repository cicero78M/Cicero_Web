export type UserDirectoryScope = "DIREKTORAT" | "ORG";

export const DIRECTORY_ROLE_CANONICAL = [
  "ditbinmas",
  "bidhumas",
  "ditsamapta",
  "ditlantas",
  "operator",
] as const;

export function normalizeDirectoryRole(value?: string): string {
  if (!value) return "";
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return "";
  const compact = normalized.replace(/[\s-_]+/g, "");
  if (compact.includes("ditbinmas")) return "ditbinmas";
  if (compact.includes("bidhumas")) return "bidhumas";
  if (compact.includes("ditsamapta")) return "ditsamapta";
  if (compact.includes("ditlantas")) return "ditlantas";
  if (compact.includes("operator")) return "operator";
  return normalized;
}

export function getEffectiveUserDirectoryScope(
  clientType?: string,
): UserDirectoryScope {
  return String(clientType || "").toUpperCase() === "DIREKTORAT"
    ? "DIREKTORAT"
    : "ORG";
}

export function getUserDirectoryFetchScope(params: {
  role?: string;
  clientType?: string;
  effectiveClientType?: string;
}): UserDirectoryScope {
  const normalizedRole = normalizeDirectoryRole(params.role);
  const isDirectorateRole =
    DIRECTORY_ROLE_CANONICAL.includes(
      normalizedRole as (typeof DIRECTORY_ROLE_CANONICAL)[number],
    ) && normalizedRole !== "operator";

  if (isDirectorateRole) {
    return "DIREKTORAT";
  }

  return getEffectiveUserDirectoryScope(
    params.clientType ?? params.effectiveClientType,
  );
}

function normalizeClientId(value?: string): string {
  return String(value || "").trim().toLowerCase();
}

function collectRoleValues(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object") {
        const candidate = item as Record<string, unknown>;
        return [
          candidate.role,
          candidate.role_name,
          candidate.roleName,
          candidate.name,
        ].filter(Boolean) as string[];
      }
      return [];
    });
  }
  return [];
}

function getUserRoleValues(user: Record<string, unknown>): string[] {
  const roleValues = [
    user.role,
    user.user_role,
    user.userRole,
    user.roleName,
    user.role_name,
    ...collectRoleValues(user.roles),
    ...collectRoleValues(user.user_roles),
    ...collectRoleValues(user.role_list),
    ...collectRoleValues(user.roleList),
  ].filter(Boolean) as string[];

  const flagRoles = DIRECTORY_ROLE_CANONICAL.filter((role) => {
    const value = user[role];
    if (value === true) return true;
    if (typeof value === "string") {
      return value.trim().toLowerCase() === "true";
    }
    return false;
  });

  return [...roleValues, ...flagRoles];
}

export function filterUserDirectoryByScope(
  users: Array<Record<string, unknown>>,
  params: {
    clientId?: string;
    role?: string;
    effectiveClientType?: string;
  },
): {
  users: Array<Record<string, unknown>>;
  scope: UserDirectoryScope;
  normalizedRole: string;
  shouldFilterByRole: boolean;
} {
  const normalizedRole = normalizeDirectoryRole(params.role);
  const shouldFilterByRole = DIRECTORY_ROLE_CANONICAL.includes(
    normalizedRole as (typeof DIRECTORY_ROLE_CANONICAL)[number],
  );
  const hasRoleSignals = users.some(
    (user) => getUserRoleValues(user).length > 0,
  );
  const shouldApplyRoleFilter = shouldFilterByRole && hasRoleSignals;
  const roleImpliesDirectorate = shouldFilterByRole && normalizedRole !== "operator";
  const scope = roleImpliesDirectorate
    ? "DIREKTORAT"
    : getEffectiveUserDirectoryScope(params.effectiveClientType);
  const normalizedClientId = normalizeClientId(params.clientId);
  const shouldFilterByClientId =
    (scope === "ORG" && !roleImpliesDirectorate) || normalizedRole === "operator";

  const filtered = users.filter((user) => {
    if (shouldApplyRoleFilter) {
      const roles = getUserRoleValues(user)
        .map((role) => normalizeDirectoryRole(role))
        .filter(Boolean);
      if (!roles.includes(normalizedRole)) {
        return false;
      }
    }

    if (shouldFilterByClientId && normalizedClientId) {
      const userClientId = normalizeClientId(
        (user.client_id ||
          user.clientId ||
          user.clientID ||
          user.client ||
          "") as string,
      );
      if (userClientId && userClientId !== normalizedClientId) {
        return false;
      }
    }

    return true;
  });

  return {
    users: filtered,
    scope,
    normalizedRole,
    shouldFilterByRole: shouldApplyRoleFilter,
  };
}
