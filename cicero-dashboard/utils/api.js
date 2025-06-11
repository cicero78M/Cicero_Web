// utils/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "NEXT_PUBLIC_API_URL is not defined; defaulting to relative '/api' paths"
  );
}
export async function getDashboardStats(token) {
  const res = await fetch(
    API_BASE_URL + '/api/dashboard/stats',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// Ambil rekap absensi instagram harian
export async function getRekapLikesIG(token, client_id, periode = "harian") {
  const params = new URLSearchParams({ client_id, periode });
  const url = `${API_BASE_URL}/api/insta/rekap-likes?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch rekap");
  return res.json();
}

// Ambil profile client berdasarkan token dan client_id
export async function getClientProfile(token, client_id) {
  const params = new URLSearchParams({ client_id });
  const url = `${API_BASE_URL}/api/clients/profile?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Gagal fetch profile client");
  return res.json();
}

// Ambil daftar user untuk User Directory
export async function getUserDirectory(token, client_id) {
  const url = `${API_BASE_URL}/api/users/list?client_id=${encodeURIComponent(client_id)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Gagal fetch daftar user");
  return res.json();
}
