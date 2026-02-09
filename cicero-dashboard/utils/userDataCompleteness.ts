/**
 * Utility functions for checking user data completeness
 * Users are considered complete if they have both Instagram and TikTok usernames
 * Users with satfung "SAT INTELKAM" and client_id "DIREKTORAT" should be excluded
 */

export interface User {
  id: string;
  nama: string;
  pangkat?: string;
  nrp_nip: string;
  satfung?: string;
  client_id?: string;
  instagram_username?: string;
  tiktok_username?: string;
  username?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Check if a user has complete social media data
 * @param user User object
 * @returns true if user has both Instagram and TikTok usernames
 */
export function isUserDataComplete(user: User): boolean {
  const hasInstagram = Boolean(user.instagram_username?.trim());
  const hasTikTok = Boolean(user.tiktok_username?.trim());
  return hasInstagram && hasTikTok;
}

/**
 * Check if a user has incomplete social media data
 * @param user User object
 * @returns true if user is missing one or both usernames
 */
export function isUserDataIncomplete(user: User): boolean {
  const hasInstagram = Boolean(user.instagram_username?.trim());
  const hasTikTok = Boolean(user.tiktok_username?.trim());
  return !hasInstagram || !hasTikTok;
}

/**
 * Check if user should be excluded from counts
 * Excludes users with satfung "SAT INTELKAM" and client_id "DIREKTORAT"
 * @param user User object
 * @returns true if user should be excluded
 */
export function shouldExcludeUser(user: User): boolean {
  const satfung = user.satfung?.trim().toUpperCase() || '';
  const clientId = user.client_id?.trim().toUpperCase() || '';
  
  return satfung.includes('SAT INTELKAM') && clientId === 'DIREKTORAT';
}

/**
 * Filter users excluding those with SAT INTELKAM + DIREKTORAT
 * @param users Array of users
 * @returns Filtered array of users
 */
export function filterExcludedUsers(users: User[]): User[] {
  return users.filter(user => !shouldExcludeUser(user));
}

/**
 * Categorize users by data completeness
 * @param users Array of users
 * @returns Object with semua, lengkap, and kurang arrays
 */
export function categorizeUsers(users: User[]) {
  const filteredUsers = filterExcludedUsers(users);
  
  return {
    semua: filteredUsers,
    lengkap: filteredUsers.filter(isUserDataComplete),
    kurang: filteredUsers.filter(isUserDataIncomplete),
  };
}

/**
 * Get user data statistics
 * @param users Array of users
 * @returns Statistics object
 */
export function getUserDataStats(users: User[]) {
  const categories = categorizeUsers(users);
  const total = categories.semua.length;
  const lengkap = categories.lengkap.length;
  const kurang = categories.kurang.length;
  
  return {
    total,
    lengkap,
    kurang,
    lengkapPercent: total > 0 ? Math.round((lengkap / total) * 100) : 0,
    kurangPercent: total > 0 ? Math.round((kurang / total) * 100) : 0,
  };
}
