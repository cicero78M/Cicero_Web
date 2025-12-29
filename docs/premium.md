# Halaman Premium CICERO

Halaman **/premium** menyediakan ringkasan paket premium Cicero dengan CTA ke formulir pendaftaran. Konten utama:

- Rekap otomatis via WA Bot ke nomor dashboard yang terdaftar.
- Jadwal pengiriman recap: **15:00**, **18:00**, dan **20:30** setiap hari.
- Halaman ANEV harian, mingguan, bulanan, serta rentang kustom.
- Unduhan Excel untuk setiap periode ANEV.
- Panduan khusus operator agar distribusi tugas dan eskalasi berjalan konsisten.

## Rute, CTA, dan alur submit backend

- **/premium**: Halaman ringkasan fitur + tombol **Daftar Sekarang** menuju formulir pendaftaran.
- **/premium/register**: Formulir pendaftaran dengan template pesan WA Bot yang dapat dikirim langsung (target `https://wa.me/+6281235114745`) sekaligus mengirim permintaan ke backend.
- Sidebar menambahkan menu **Premium** sehingga halaman dapat diakses dari navigasi utama dashboard.
- CTA pada halaman insight Instagram dan TikTok ditempatkan di area aksi rekap (sticky bottom) agar mudah dijangkau setelah menyalin laporan.
- Form `/premium/register` kini mengirim POST ke endpoint backend **`/api/premium/request`** dengan payload ringkas:
  - `username`, `client_id`, dan `uuid` terisi otomatis dari sesi login.
    - Nilai berasal dari token autentikasi (payload JWT) atau profil yang diambil setelah login. Jika pengguna login ulang, nilai akan diisi ulang dari token tanpa perlu refresh manual.
  - `premium_tier`, `bank_name`, `sender_name`, `account_number`.
  - `amount` berisi harga dasar + suffix acak (nominal unik).
- Langkah pengguna: **isi form** (pilih paket → detail rekening) → **submit** (permintaan terkirim + form terkunci saat loading/berhasil) → **verifikasi** (tim cek nominal unik & rekening pengirim sebelum mengaktifkan recap).
  - Instruksi transfer ditampilkan di panel info dengan rekening **0891758684 (BCA a.n Rizqa Febryan Prastyo)** dan catatan mencantumkan client ID/UUID untuk mempercepat verifikasi.
  - Nominal unik yang sama dikirim ke backend dan ditampilkan sebagai label “Jumlah yang harus ditransfer”.

## Penempatan CTA di Insight

- CTA insight Instagram dan TikTok menggunakan tautan gradasi biru–ungu dengan ikon **Sparkles** dan teks ajakan (mis. “Coba Premium untuk rekap otomatis”). Letakkan di samping tombol salin rekap sehingga lebarnya memenuhi ruang tersisa (gunakan `flex-1` pada wrapper).
- Untuk kasus lain, prop `headerAction` pada `components/InsightLayout` tetap dapat dipakai jika CTA harus muncul di header tanpa menggeser tab insight/rekap.

## Harga dasar & nominal transfer

- Setiap paket memiliki harga dasar dan tiga digit acak untuk memudahkan pencocokan pembayaran:
  - **Premium 1**: Rp 300.000 + suffix acak (000–999) → tampil sebagai `Rp 300.xxx`. Manfaat: recap WA Bot 15:00/18:00/20:30, akses ANEV harian–bulanan, unduhan Excel + panduan operator dasar.
  - **Premium 2**: Rp 200.000 + suffix acak → tampil sebagai `Rp 200.xxx`. Manfaat: prioritas Web Dashboard untuk ANEV serta akses unduhan data.
  - **Premium 3**: Rp 1.100.000 + suffix acak → tampil sebagai `Rp 1.100.xxx`. Manfaat: prioritas WA Bot dengan rekap terjadwal dan file Excel ANEV bulanan.
- Saat pengguna memilih paket di formulir `/premium/register`, suffix di-generate otomatis dan ditampilkan pada label “Jumlah yang harus ditransfer”. Nominal numerik yang sama dikirim ke backend lewat payload permintaan premium.
- Suffix dikunci saat proses submit berlangsung (tidak bisa mengganti paket selama loading atau setelah berhasil terkirim).
- Instruksi transfer ditampilkan jelas di panel informasi: gunakan rekening **0891758684 (BCA a.n Rizqa Febryan Prastyo)** dan sertakan client ID/UUID pada catatan transfer agar verifikasi otomatis lebih cepat.
- Setelah submit formulir, tim memverifikasi data pembayaran (nominal + rekening pengirim) sebelum mengaktifkan recap WA Bot sesuai paket.
