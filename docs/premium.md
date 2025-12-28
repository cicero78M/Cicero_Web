# Halaman Premium CICERO

Halaman **/premium** menyediakan ringkasan paket premium Cicero dengan CTA ke formulir pendaftaran. Konten utama:

- Rekap otomatis via WA Bot ke nomor dashboard yang terdaftar.
- Jadwal pengiriman recap: **15:00**, **18:00**, dan **20:30** setiap hari.
- Halaman ANEV harian, mingguan, bulanan, serta rentang kustom.
- Unduhan Excel untuk setiap periode ANEV.
- Panduan khusus operator agar distribusi tugas dan eskalasi berjalan konsisten.

## Rute dan CTA

- **/premium**: Halaman ringkasan fitur + tombol **Daftar Sekarang** menuju formulir pendaftaran.
- **/premium/register**: Formulir pendaftaran dengan template pesan WA Bot yang dapat dikirim langsung (target `https://wa.me/+6281235114745`).
- Sidebar menambahkan menu **Premium** sehingga halaman dapat diakses dari navigasi utama dashboard.
- Header insight Instagram dan TikTok kini menampilkan tombol **Premium** (kanan atas) yang juga mengarah ke **/premium**.

## Penempatan CTA di Insight

- Gunakan prop `headerAction` pada `components/InsightLayout` untuk merender CTA di sisi kanan header tanpa menggeser tab insight/rekap.
- CTA bawaan insight Instagram dan TikTok menggunakan kelas gradasi biru–ungu dan fokus ring `focus-visible:ring-indigo-200` agar mudah diakses di desktop maupun mobile.
