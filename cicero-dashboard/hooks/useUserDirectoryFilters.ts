import { useMemo } from "react";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import { filterUsersByClientId } from "@/utils/directorateClientSelector";

function isActiveUser(user: Record<string, any>) {
  return user.status === true || String(user.status).toLowerCase() === "true";
}

function matchStatusFilter(user: Record<string, any>, statusFilter: string) {
  if (statusFilter === "ALL") return true;
  const active = isActiveUser(user);
  if (statusFilter === "ACTIVE") return active;
  if (statusFilter === "INACTIVE") return !active;
  return true;
}

function matchSearchFilter(user: Record<string, any>, searchTerm: string) {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  return (
    (user.nama_client || user.nama || "").toLowerCase().includes(term) ||
    (user.title || "").toLowerCase().includes(term) ||
    (user.user_id || "").toLowerCase().includes(term) ||
    (user.divisi || "").toLowerCase().includes(term) ||
    (user.insta || "").toLowerCase().includes(term) ||
    (user.tiktok || "").toLowerCase().includes(term) ||
    (user.email || "").toLowerCase().includes(term) ||
    String(user.status).toLowerCase().includes(term)
  );
}

export function useUserDirectoryFilters(params: {
  users: Array<Record<string, any>>;
  clientId?: string;
  isDirectorate: boolean;
  selectedClientId: string;
  isDitbinmasClient: boolean;
  showAllDitbinmas: boolean;
  statusFilter: string;
  debouncedSearch: string;
}) {
  const {
    users,
    clientId,
    isDirectorate,
    selectedClientId,
    isDitbinmasClient,
    showAllDitbinmas,
    statusFilter,
    debouncedSearch,
  } = params;

  const sortedUsers = useMemo(() => {
    const baseSorted = [...users].sort(compareUsersByPangkatAndNrp);
    return prioritizeUsersForClient(baseSorted, clientId);
  }, [users, clientId]);

  const filtered = useMemo(() => {
    const clientFiltered = isDirectorate
      ? filterUsersByClientId(sortedUsers, selectedClientId)
      : sortedUsers;

    return clientFiltered
      .filter((u) => {
        if (isDitbinmasClient && !showAllDitbinmas) {
          return (
            String(
              u.client_id || u.clientId || u.clientID || u.client || "",
            ).toUpperCase() === "DITBINMAS"
          );
        }
        return true;
      })
      .filter((u) => matchStatusFilter(u, statusFilter))
      .filter((u) => matchSearchFilter(u, debouncedSearch));
  }, [
    sortedUsers,
    isDirectorate,
    selectedClientId,
    isDitbinmasClient,
    showAllDitbinmas,
    statusFilter,
    debouncedSearch,
  ]);

  const rekapFilteredUsers = useMemo(() => {
    const clientFiltered = isDirectorate
      ? filterUsersByClientId(sortedUsers, selectedClientId)
      : sortedUsers;
    return clientFiltered
      .filter((u) => matchStatusFilter(u, statusFilter))
      .filter((u) => matchSearchFilter(u, debouncedSearch));
  }, [sortedUsers, debouncedSearch, statusFilter, isDirectorate, selectedClientId]);

  const rekapUsers = useMemo(() => {
    const grouped: Record<string, Array<Record<string, any>>> = {};
    const clientFilteredUsers = isDirectorate
      ? filterUsersByClientId(sortedUsers, selectedClientId)
      : sortedUsers;

    clientFilteredUsers
      .filter((u) => {
        if (isDitbinmasClient && !showAllDitbinmas) {
          const cid = String(
            u.client_id || u.clientId || u.clientID || u.client || "",
          ).toUpperCase();
          return cid === "DITBINMAS";
        }
        return true;
      })
      .forEach((u) => {
        const key = u.divisi || "-";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(u);
      });
    return grouped;
  }, [sortedUsers, isDitbinmasClient, showAllDitbinmas, isDirectorate, selectedClientId]);

  const summaryStats = useMemo(() => {
    const list = Object.values(rekapUsers).flat();
    const total = list.length;
    const aktif = list.filter((u) => isActiveUser(u)).length;
    const nonaktif = total - aktif;
    const insta = list.filter((u) => Boolean(u.insta)).length;
    const tiktok = list.filter((u) => Boolean(u.tiktok)).length;
    return { total, aktif, nonaktif, insta, tiktok };
  }, [rekapUsers]);

  return {
    filtered,
    rekapFilteredUsers,
    rekapUsers,
    summaryStats,
    isUserActive: isActiveUser,
  };
}

