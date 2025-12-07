# Satbinmas Official

Halaman `/satbinmas-official` disiapkan khusus untuk pengguna Ditbinmas sebagai dasbor pemantauan akun resmi Satbinmas dan Polres jajaran.

## Akses dan proteksi
- Menggunakan `useRequireAuth` dan validasi tambahan agar hanya kombinasi `client_id` **DITBINMAS** dengan `role` **Ditbinmas** yang dapat membuka halaman. Pengguna lain menerima tampilan 403 dan diarahkan kembali ke beranda.

## Filter global
- Pemilihan periode harian, mingguan, bulanan, atau rentang khusus melalui `ViewDataSelector`.
- Dropdown platform (All/Instagram/TikTok) dan Polres untuk menyaring seluruh seksi di halaman.

## Struktur insight
- **Ringkasan coverage akun resmi**: kartu statistik dan tabel Polres berisi status aktif/dormant serta total followers.
- **Aktivitas konten**: bar chart per platform dan heatmap kalender untuk 10 konten dengan interaksi tertinggi.
- **Kualitas & engagement**: total/rata-rata likes dan komentar, daftar 10 Polres teratas, serta daftar konten terbaik.
- **Pola konten**: leaderboard hashtag dan mention guna memudahkan koordinasi publikasi.

Seluruh data menampilkan state loading, error, serta empty state agar pengalaman pengguna konsisten dengan halaman lain di dashboard.
