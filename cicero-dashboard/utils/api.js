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
