export function extractRekapLikesUsers(response: any): any[] {
  if (!response) return [];

  const candidates = [
    response?.data?.data,
    response?.data?.rekap,
    response?.data,
    response?.rekap,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

export default extractRekapLikesUsers;
