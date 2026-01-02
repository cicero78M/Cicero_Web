# Halaman Premium CICERO

Halaman **/premium** menyediakan ringkasan paket premium Cicero dengan CTA ke formulir pendaftaran. Konten utama:

- Rekap otomatis via WA Bot ke nomor dashboard yang terdaftar.
- Jadwal pengiriman recap: **15:00**, **18:00**, dan **20:30** setiap hari.
- Halaman ANEV harian, mingguan, bulanan, serta rentang kustom.
- Halaman **Dashboard ANEV Polres** (tier **Premium 1** dan **Premium 3**) dengan filter waktu, scope ORG/DIREKTORAT, role, serta regional ID untuk meninjau kepatuhan tugas dan rekap konten per pelaksana.
- Unduhan Excel untuk setiap periode ANEV.
- Panduan khusus operator agar distribusi tugas dan eskalasi berjalan konsisten.

## Rute, CTA, dan alur submit backend

- **/premium**: Halaman ringkasan fitur + tombol **Daftar Sekarang** menuju formulir pendaftaran.
- **/premium/register**: Formulir pendaftaran dengan template pesan WA Bot yang dapat dikirim langsung (target `https://wa.me/+6281235114745`) sekaligus mengirim permintaan ke backend.
- Sidebar menambahkan menu **Premium** sehingga halaman dapat diakses dari navigasi utama dashboard.
- CTA pada halaman insight Instagram dan TikTok ditempatkan di area aksi rekap (sticky bottom) agar mudah dijangkau setelah menyalin laporan.
- Form `/premium/register` kini mengirim POST ke endpoint backend **`/api/premium/request`** dengan field yang disetujui backend:
  - `premium_tier`, `bank_name`, `sender_name`, `account_number`.
  - `unique_code` (suffix acak yang ditampilkan di UI) serta `request_id`/`premium_request_id` bila backend sudah memberikan konteks permintaan aktif.
  - `transfer_amount` dan `amount` berisi harga dasar + suffix acak (nominal unik) yang dikunci setelah paket dipilih atau mengikuti nilai yang dikirim backend.
  - Identifier opsional `dashboard_user_id` atau `user_id` dari context login; UI tidak lagi meminta/menampilkan `username` maupun `client_id`.
  - Respons `data` dari backend juga dinormalisasi; UI membaca `transfer_amount` atau fallback ke `amount` sebagai `transferAmount` agar nominal yang dikunci backend selalu ditampilkan konsisten di form.
  - Tombol submit akan menunggu context backend selesai dimuat dan otomatis menolak klik tambahan bila backend sudah menandai permintaan premium sebelumnya masih diproses. Saat penolakan terjadi, UI memuat ulang context (`/api/premium/request/latest`) dan mengunci form dengan pesan status backend agar pengguna tidak mengirim duplikasi.
- Contoh payload yang dikirim ke backend:
  ```json
  {
    "premium_tier": "premium_1",
    "bank_name": "BCA",
    "sender_name": "Rizqa Febryan",
    "account_number": "1234567890",
    "unique_code": "742",
    "request_id": "req_01J0EXAMPLE",
    "transfer_amount": 300742,
    "amount": 300742,
    "dashboard_user_id": "dash_901",
    "user_id": "user_901"
  }
  ```
- Backend `/api/premium/request/latest` mengembalikan `dashboard_user_id`/`user_id`, status permintaan (`pending/processing/waiting_payment`), `request_id`, serta nominal unik bila sudah dipilih di server agar UI tidak menghitung ulang suffix yang sudah dikunci backend.
- Langkah pengguna: **pilih paket** (nominal unik di-generate atau mengikuti context backend) → **isi detail rekening & nama pengirim** → **submit** (form terkunci saat loading/berhasil atau ketika backend menandai status pending, payload berisi nominal unik + identifier login + `request_id`) → **verifikasi** (tim cek nominal unik & rekening pengirim sebelum mengaktifkan recap).
  - Instruksi transfer ditampilkan di panel info dengan rekening **0891758684 (BCA a.n Rizqa Febryan Prastyo)** dan catatan mencantumkan nama pengirim untuk mempercepat verifikasi.
  - Nominal unik yang sama dikirim ke backend dan ditampilkan sebagai label “Jumlah yang harus ditransfer”; form tidak lagi menampilkan atau memvalidasi `username`/`Client ID` sehingga QA tidak mencari field yang sudah dihapus.

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
- Instruksi transfer ditampilkan jelas di panel informasi: gunakan rekening **0891758684 (BCA a.n Rizqa Febryan Prastyo)** dan sertakan nama pengirim pada catatan transfer agar verifikasi otomatis lebih cepat.
- Setelah submit formulir, tim memverifikasi data pembayaran (nominal + rekening pengirim) sebelum mengaktifkan recap WA Bot sesuai paket.
- Guard premium untuk halaman **Dashboard ANEV Polres** memakai `useRequirePremium` dan memblokir akses jika tier bukan **Premium 1** atau **Premium 3**. API `/api/dashboard/anev` akan mengembalikan 403 ketika tier tidak sesuai; UI menampilkan pesan akses premium lengkap dengan CTA daftar dan informasi tier/expiry yang dikembalikan backend.
- Guard menunggu indikator `hasResolvedPremium` dari `AuthContext` (diset setelah percobaan fetch profil selesai, termasuk kegagalan) sebelum melakukan redirect, sehingga tier selalu dievaluasi dulu. Ketika fetch profil gagal, hook menampilkan toast error sebagai fallback dan tidak mengarahkan ke **/premium** hingga evaluasi tier berhasil; redirect hanya terjadi jika `isPremiumTierAllowedForAnev(premium_tier)` mengembalikan `false`.
