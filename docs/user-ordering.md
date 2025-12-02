# Penentuan Urutan Pengguna

Fungsi `prioritizeUsersForClient` (`cicero-dashboard/utils/userOrdering.ts`) memastikan urutan pengguna yang konsisten untuk klien tertentu.

- Untuk `client_id` **BIDHUMAS**, pengguna bernama **"KOMPOL DADANG WIDYO PRABOWO,S.I.K"** selalu ditempatkan di posisi pertama setelah data diurutkan.
- Fungsi ini digunakan di:
  - Direktori user (`cicero-dashboard/app/users/page.jsx`).
  - Rekap likes Instagram (`cicero-dashboard/hooks/useInstagramLikesData.ts` dan `cicero-dashboard/components/RekapLikesIG.jsx`).
  - Rekap komentar TikTok (`cicero-dashboard/app/comments/tiktok/rekap/page.jsx` dan `cicero-dashboard/components/RekapKomentarTiktok.jsx`).

Tambahkan pemanggilan fungsi ini jika ada modul baru yang menampilkan daftar pengguna terurut untuk klien BIDHUMAS agar konsistensi tetap terjaga.
