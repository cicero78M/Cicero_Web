// utils/api.js
export async function getDashboardStats(token) {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + '/api/dashboard/stats',
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
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/insta/rekap-likes?${params.toString()}`;

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
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/clients/profile?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Gagal fetch profile client");
  return res.json();
}
