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
