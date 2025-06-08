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
export async function getRekapLikesIG(token, client_id) {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + `/api/insta/rekap-likes?client_id=${client_id}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!res.ok) throw new Error("Failed to fetch rekap");
  return res.json();
}
