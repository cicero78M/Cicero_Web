# Executive Summary

Proyek **Cicero** terdiri dari tiga repositori utama yang saling terintegrasi:

1. **Cicero_V2** – backend Node.js/Express untuk otomasi monitoring dan analitik
   konten Instagram & TikTok.
2. **Cicero_Web** – dashboard Next.js yang menampilkan data hasil pemantauan.
3. **pegiat_medsos_apps** – aplikasi Android ringan untuk agen lapangan.

Dokumen ini merangkum arsitektur tinggi dan alur kerja antar komponen.

## Akses

Halaman **Executive Summary** hanya ditampilkan pada sidebar dan dapat diakses apabila
pengguna memiliki kombinasi `client_id` **DITBINMAS** dengan `role` **ditbinmas**.
Pengguna lain akan dialihkan kembali ke dashboard utama ketika mencoba membuka
halaman ini.

## Cicero_V2 Backend

- Dirancang sebagai sistem otomasi monitoring multi-client, rekap otomatis likes dan komentar.【F:/tmp/Cicero_V2/README.md†L6-L7】
- Arsitektur meliputi REST API berbasis Express, database PostgreSQL, RabbitMQ
  untuk antrean, Redis untuk cache dan sesi, serta integrasi WhatsApp via
  `whatsapp-web.js`.【F:/tmp/Cicero_V2/docs/enterprise_architecture.md†L8-L14】
- Cron job menjalankan berbagai tugas terjadwal seperti fetch posting, pengiriman
  laporan harian, hingga data mining akun pada malam hari.【F:/tmp/Cicero_V2/docs/activity_schedule.md†L8-L17】

## Cicero_Web Dashboard

- Frontend berbasis Next.js 14 menggunakan TypeScript dan Tailwind CSS.
- Komunikasi dengan backend dilakukan lewat helper di `utils/api.ts` dan URL dasar
  diatur lewat variabel `NEXT_PUBLIC_API_URL`.【F:/tmp/Cicero_V2/docs/enterprise_architecture.md†L32-L39】
- Menyajikan halaman analitik Instagram dan TikTok, direktori pengguna,
  serta informasi client melalui folder `app/` di dalam proyek.【F:/tmp/Cicero_V2/docs/enterprise_architecture.md†L32-L38】
- Hook `useInstagramLikesData` dan utilitas `fetchDitbinmasAbsensiLikes` membangun rekap absensi likes lintas Polres sekaligus mendukung mode tampilan per satker, lalu menyajikan tombol "Copy Rekap" untuk distribusi cepat via WA.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L42-L204】【F:cicero-dashboard/utils/absensiLikes.ts†L1-L188】【F:cicero-dashboard/utils/buildInstagramRekap.ts†L1-L56】
- Segmen "Rincian Kinerja Platform" menampilkan kontribusi likes dan komentar per konten (jumlah konten bulanan menjadi pembagi) sehingga persentase keterlibatan satker lebih representatif pada chart bar.
- Knowledge base `/mekanisme-absensi` dan `/panduan-sop` menyediakan konteks SOP, matriks RACI, panduan WA bot, dan FAQ shadowban yang mempercepat onboarding pengguna baru.【F:cicero-dashboard/app/mekanisme-absensi/page.jsx†L1-L320】【F:cicero-dashboard/app/panduan-sop/page.jsx†L1-L320】

## Aplikasi Android pegiat_medsos_apps

- Merupakan skeleton Android dengan beberapa activity: `MainActivity`,
  `LoginActivity`, `UserProfileActivity`, `DashboardActivity`, dan `ReportActivity`.
  `MainActivity` memeriksa token JWT dan langsung membuka dashboard bila valid.
  【F:/tmp/pegiat_medsos_apps/README.md†L3-L11】
- Setelah login, token dan user ID digunakan untuk memuat detail profil melalui
  API backend dan menampilkan statistik Instagram pengguna.【F:/tmp/pegiat_medsos_apps/README.md†L21-L25】
- Dokumentasi arsitektur dan cara build dapat ditemukan pada `docs/ARCHITECTURE.md`
  dan `docs/USAGE.md` di repo tersebut.【F:/tmp/pegiat_medsos_apps/README.md†L28-L37】

## Orkestrasi Sistem

1. **Autentikasi** – Pengguna login lewat dashboard atau aplikasi Android yang
   menembus endpoint `/api/auth/user-login` pada backend. Backend mengembalikan
   token JWT yang disimpan di front-end dan perangkat seluler.【F:/tmp/Cicero_V2/docs/enterprise_architecture.md†L43-L46】
2. **Pengambilan Data** – Dashboard dan aplikasi Android memanggil endpoint
   backend (misalnya `/api/insta/rapid-posts`) untuk memfetch data Instagram/TikTok.
   Backend menyimpan hasilnya di PostgreSQL dan Redis agar respons cepat dan konsisten.
   【F:/tmp/Cicero_V2/docs/enterprise_architecture.md†L48-L52】
3. **Laporan Harian** – Backend menyusun laporan harian atas aktivitas pengguna dan konten yang terpantau.【F:/tmp/Cicero_V2/docs/activity_schedule.md†L8-L17】
4. **Queue Processing** – Untuk beban besar, tugas dapat dipublikasikan ke RabbitMQ
   dan diproses asinkron sehingga dashboard tetap responsif.【F:/tmp/Cicero_V2/docs/enterprise_architecture.md†L56-L57】

## Kesimpulan

Ketiga repositori ini bekerja sama untuk menyediakan platform monitoring media
sosial yang lengkap. Cicero_V2 berperan sebagai pusat logika bisnis dan database.
Cicero_Web menghadirkan antarmuka analitik berbasis web, sementara aplikasi
pegiat_medsos_apps membantu agen lapangan berinteraksi langsung melalui perangkat
Android. Integrasi dengan RapidAPI, PostgreSQL, Redis, RabbitMQ, dan WhatsApp
membuat sistem mampu menampilkan data terkini, mengirim notifikasi otomatis, dan
memproses pekerjaan berskala besar dengan efisien.
