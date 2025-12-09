# Penentuan Urutan Pengguna

Fungsi `prioritizeUsersForClient` (`cicero-dashboard/utils/userOrdering.ts`) memastikan urutan pengguna yang konsisten untuk klien tertentu.

- Untuk `client_id` **BIDHUMAS**, pengguna bernama **"KOMPOL DADANG WIDYO PRABOWO,S.I.K"** atau **"DADANG WIDYO PRABOWO,S.I.K"** selalu ditempatkan di posisi pertama setelah data diurutkan. Prioritisasi dilakukan setelah proses sorting utama agar urutan khusus ini tidak tertimpa oleh comparator lain.
- Fungsi ini digunakan di:
  - Direktori user (`cicero-dashboard/app/users/page.jsx`).
  - Rekap likes Instagram (`cicero-dashboard/hooks/useInstagramLikesData.ts` dan `cicero-dashboard/components/RekapLikesIG.jsx`).
- Rekap komentar TikTok (`cicero-dashboard/app/comments/tiktok/rekap/page.jsx` dan `cicero-dashboard/components/RekapKomentarTiktok.jsx`).
  - Saat menyalin teks rekap komentar TikTok, header laporan kini mengikuti klien bertipe **DIREKTORAT** sesuai role pengguna. Nama singkat dan nama resmi direktorat ditarik dari profil klien atau layanan `getClientNames`, lalu menggantikan label "Ditbinmas"/"Direktorat Binmas" pada pesan WhatsApp otomatis sehingga sapaan selalu relevan dengan role login.

  - Halaman rekap komentar TikTok memanfaatkan `effectiveRole` serta `effectiveClientType` dari konteks autentikasi agar penentuan jalur direktorat/klien mengikuti normalisasi peran pengguna. Kasus khusus **DITSAMAPTA** dengan role **BIDHUMAS** dipaksa memakai tipe klien **ORG**, sehingga daftar `clientIds` maupun rute pengambilan data tidak lagi menggunakan jalur direktorat dan hanya menarik rekap berdasarkan `client_id` DITSAMAPTA.
  - Hook `useTiktokCommentsData` kini memprioritaskan `effectiveRole` dan `effectiveClientType` yang sudah dinormalisasi pada konteks autentikasi sebelum jatuh ke hasil `getDashboardStats` maupun profil klien. Nilai efektif ini kemudian dipakai saat menentukan jalur direktorat, pemilihan `dashboardClientId`, dan filtrasi direktori agar klien remap seperti **DITSAMAPTA BIDHUMAS** tetap diperlakukan sebagai ORG.

Tambahkan pemanggilan fungsi ini jika ada modul baru yang menampilkan daftar pengguna terurut untuk klien BIDHUMAS agar konsistensi tetap terjaga.
