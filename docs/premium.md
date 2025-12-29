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
- CTA pada halaman insight Instagram dan TikTok ditempatkan di area aksi rekap (sticky bottom) agar mudah dijangkau setelah menyalin laporan.

## Penempatan CTA di Insight

- CTA insight Instagram dan TikTok menggunakan tautan gradasi biru–ungu dengan ikon **Sparkles** dan teks ajakan (mis. “Coba Premium untuk rekap otomatis”). Letakkan di samping tombol salin rekap sehingga lebarnya memenuhi ruang tersisa (gunakan `flex-1` pada wrapper).
- Untuk kasus lain, prop `headerAction` pada `components/InsightLayout` tetap dapat dipakai jika CTA harus muncul di header tanpa menggeser tab insight/rekap.

## Harga dasar & nominal transfer

- Setiap paket memiliki harga dasar dan tiga digit acak untuk memudahkan pencocokan pembayaran:
  - **Premium 30 Hari**: Rp 300.000 + suffix acak (000–999) → tampil sebagai `Rp 300.xxx`.
  - **Premium 90 Hari**: Rp 200.000 + suffix acak (000–999) → tampil sebagai `Rp 200.xxx`.
  - **Premium Kustom**: Rp 100.000 + suffix acak (000–999) → tampil sebagai `Rp 100.xxx`.
- Saat pengguna memilih paket di formulir `/premium/register`, suffix di-generate otomatis dan ditampilkan pada label “Jumlah yang harus ditransfer”. Nominal numerik yang sama dikirim ke backend lewat payload permintaan premium.
- Suffix dikunci saat proses submit berlangsung (tidak bisa mengganti paket selama loading atau setelah berhasil terkirim).
