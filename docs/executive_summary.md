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
- Hook `useInstagramLikesData` dan utilitas `fetchDitbinmasAbsensiLikes` membangun rekap absensi likes lintas Polres sekaligus mendukung mode tampilan per satker, lalu menyajikan tombol "Copy Rekap" untuk distribusi cepat via WA.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L42-L204】【F:cicero-dashboard/utils/absensiLikes.ts†L1-L188】【F:cicero-dashboard/utils/instagramEngagement.ts†L71-L120】
- Segmen "Rincian Kinerja Platform" menampilkan kontribusi likes dan komentar per konten (jumlah konten bulanan menjadi pembagi) sehingga persentase keterlibatan satker lebih representatif pada chart bar.
- Segmen "Personil dengan Likes Tertinggi" dan "Personil dengan Komentar Tertinggi" sekarang menormalkan rekap bulan berjalan yang mungkin dibungkus `data/chartData/records/users`, lalu memprioritaskan batch tersebut per klien untuk menghitung totalLikes/totalComments serta peringkat personel; data aktivitas mentah hanya dipakai ketika rekap kosong sehingga tidak ada penjumlahan ganda lintas bulan pada personel dengan alias yang sama.【F:cicero-dashboard/app/executive-summary/dataTransforms.js†L1206-L1288】【F:cicero-dashboard/app/executive-summary/dataTransforms.js†L1605-L1770】【F:cicero-dashboard/app/executive-summary/dataTransforms.js†L2108-L2132】【F:cicero-dashboard/components/executive-summary/PlatformLikesSummary.tsx†L348-L368】
- Sanitasi tren aktivitas kini menyediakan opsi `applyFallbackDate` pada `prepareTrendActivityRecords`, dan halaman Executive Summary memanfaatkan opsi ini ketika memfilter bulan aktif agar catatan tanpa tanggal tidak dipaksakan memakai tanggal awal bulan serta tidak memengaruhi peringkat personil atau likes bulanan yang sedang dilihat pengguna.【F:cicero-dashboard/app/executive-summary/dataTransforms.js†L2221-L2279】【F:cicero-dashboard/app/executive-summary/page.jsx†L3812-L3897】
- Knowledge base `/mekanisme-absensi` dan `/panduan-sop` menyediakan konteks SOP, matriks RACI, panduan WA bot, dan FAQ shadowban yang mempercepat onboarding pengguna baru.【F:cicero-dashboard/app/mekanisme-absensi/page.jsx†L1-L320】【F:cicero-dashboard/app/panduan-sop/page.jsx†L1-L320】
- Ringkasan eksekutif kini diambil dari endpoint Cicero_V2 yang tersedia, yakni `GET /api/clients/{client_id}/summary`, melalui helper `getExecutiveSummary` (`cicero-dashboard/utils/api.ts`). Permintaan selalu menyertakan `client_id` di path serta parameter pendukung `month`/`period` (YYYY-MM), `period_scope=monthly`, rentang tanggal (`start_date`/`end_date` hasil `getMonthDateRange`), dan konteks akses Ditbinmas (`scope`, `role`, `regional_id`) agar backend menghitung rekap sesuai kewenangan. Untuk data konten, helper `getInstagramPosts` tetap diarahkan ke rute `/api/instagram/posts` dan meneruskan `scope`, `role`, serta `regional_id` agar otorisasi lintas satker tetap dijaga.
- Pengambilan konten TikTok lewat helper `getTiktokPosts` kini ikut meneruskan `scope`, `role`, dan `regional_id` ke endpoint `/api/tiktok/posts` sehingga permintaan Ditbinmas dapat dibatasi ke cakupan satker yang relevan (mis. `client_id=DITBINMAS&start_date=2025-10-01&end_date=2025-10-31` hanya menarik data sesuai akses regional yang diizinkan).
- Di halaman Executive Summary, permintaan konten TikTok menunggu profil dan `effectiveClientType` selesai dimuat sebelum menembak `/api/tiktok/posts`, sehingga parameter `scope` dan `regional_id` selalu ikut dikirim untuk periode aktif maupun periode pembanding.
- Pemanggilan konten Instagram pada halaman Executive Summary otomatis memuat ulang ketika profil, role, scope, atau `regional_id` dari konteks autentikasi berubah sehingga kueri `/api/instagram/posts` selalu membawa parameter cakupan Ditbinmas (contoh: `scope=ALL&regional_id=JATIM`).【F:cicero-dashboard/app/executive-summary/page.jsx†L3645-L3653】
- Ringkasan kinerja bulanan tidak lagi bergantung pada payload `summaryMetrics` backend. Frontend menghitung metrik utama (total likes, komentar, engagement, jumlah konten, serta delta vs bulan sebelumnya) melalui helper `getMonthlyPlatformRecap` yang memanggil empat endpoint: `getRekapLikesIG`, `getRekapKomentarTiktok`, `getInstagramPosts`, dan `getTiktokPosts`. Setiap permintaan meneruskan `client_id`, `role`, `scope`, `regional_id`, serta rentang tanggal (`start_date`/`end_date` dan `tanggal_mulai`/`tanggal_selesai`) yang dihasilkan dari filter bulan aktif dan bulan pembanding. Hasil agregasi dibentuk menjadi narasi ringkas dan daftar highlight oleh utilitas `buildMonthlyPerformanceNarrative` pada `/executive-summary`, sehingga kartu metrik dan narasi mengandalkan rekap likes/komentar dan daftar konten terkini.【F:cicero-dashboard/utils/api.ts†L1337-L1442】【F:cicero-dashboard/app/executive-summary/page.jsx†L136-L218】【F:cicero-dashboard/app/executive-summary/page.jsx†L305-L425】【F:cicero-dashboard/app/executive-summary/page.jsx†L3011-L3134】【F:cicero-dashboard/app/executive-summary/page.jsx†L5041-L5092】
- Normalisasi konten TikTok pada helper `getMonthlyPlatformRecap` kini membaca payload berbentuk array maupun objek (`data` atau `posts`) sehingga jumlah konten bulanan, delta periode, dan agregasi engagement menghitung gabungan konten Instagram dan TikTok alih-alih hanya IG.【F:cicero-dashboard/utils/api.ts†L1476-L1526】【F:cicero-dashboard/app/executive-summary/page.jsx†L244-L294】【F:cicero-dashboard/app/executive-summary/page.jsx†L3011-L3134】
- Bagian **Narasi Per Kanal**, **Kontribusi Kanal**, dan **Komposisi Audiens** menyusun narasi otomatis ketika backend belum mengirim teks, berdasarkan jumlah konten per platform, jangkauan tertinggi per kanal, serta segmen audiens teratas pada periode aktif. Narasi ditampilkan berdampingan dengan kartu Ringkasan Kinerja Bulanan dan chart bar/pie untuk memastikan informasi kontribusi kanal dan audiens tetap terbaca pengguna.【F:cicero-dashboard/app/executive-summary/page.jsx†L244-L294】【F:cicero-dashboard/app/executive-summary/page.jsx†L3302-L3483】【F:cicero-dashboard/app/executive-summary/page.jsx†L5452-L5570】
- Permintaan rekap komentar TikTok di halaman Executive Summary kini ikut mengirim `scope` dan `regional_id` yang disarikan dari profil login maupun objek `profile.client` (termasuk variasi penamaan `scope_rekap`, `akses_scope`, dan `region_id`). Dengan begitu, panggilan seperti `/api/tiktok/rekap-komentar?client_id=DITBINMAS&periode=harian&tanggal=2025-10-01&tanggal_mulai=2025-10-01&start_date=2025-10-01&tanggal_selesai=2025-10-31&end_date=2025-10-31&role=ditbinmas` otomatis menambahkan konteks cakupan dan wilayah sesuai akses Ditbinmas yang berlaku.
- Permintaan rekap likes harian yang dipakai kartu Executive Summary kini menyalurkan `scope` dan `regional_id` dari profil/login saat memanggil `/api/insta/rekap-likes`, sehingga kueri bulanan seperti `client_id=DITBINMAS&periode=harian` turut menghormati filter wilayah ketika menghitung tren likes maupun perbandingan periode sebelumnya.【F:cicero-dashboard/app/executive-summary/page.jsx†L124-L151】【F:cicero-dashboard/app/executive-summary/page.jsx†L3140-L3343】
- Segmen tren aktivitas bulanan kini memadukan konten bulan berjalan (`start_date`/`end_date` sesuai pilihan) dengan batch bulan pembanding yang dipanggil terpisah lewat `/api/instagram/posts` dan `/api/tiktok/posts`, lalu dihimpun di frontend agar metrik "bulan sebelumnya" pada kartu tren mengikuti data mentah dari backend tanpa terpotong filter periode aktif.【F:cicero-dashboard/app/executive-summary/page.jsx†L2823-L3698】【F:cicero-dashboard/app/executive-summary/page.jsx†L4136-L4508】
- Respons yang dikonsumsi UI kini ditoleransi dalam format camelCase maupun snake_case: bidang seperti `monthLabel`/`month_label`, `summaryMetrics`/`summary_metrics`, `engagementByChannel`/`engagement_by_channel`, `audienceComposition`/`audience_composition`, `contentTable`/`content_table`, dan `platformAnalytics`/`platform_analytics` semuanya dinormalisasi oleh `normalizeExecutiveSummaryPayload` di `app/executive-summary/page.jsx`. Hasil normalisasi memuat label periode, metrik ringkasan (label, value, suffix, change/delta), highlights, komposisi audiens, top konten, analitik platform, serta narasi (overview/dashboard/instagram/tiktok) yang dipetakan langsung ke kartu, chart, dan tabel `/executive-summary`. Payload posting Instagram dari endpoint baru tetap dinormalisasi ke bidang `like_count`, `comment_count`, `share_count`, `save_count`, `view_count`, `reach`, `engagement_rate`, serta tanggal `published_at/activityDate` sehingga perhitungan tren bulanan & mingguan konsisten.
- Jumlah konten TikTok pada Ringkasan Kinerja Bulanan kini disaring berdasarkan tanggal publikasi/aktivitas (`published_at`, `create_time`, `activityDate`, dst.) agar hanya konten dalam rentang bulan aktif maupun bulan pembanding yang dihitung pada total dan delta volume konten.【F:cicero-dashboard/app/executive-summary/sharedUtils.js†L5-L31】【F:cicero-dashboard/app/executive-summary/page.jsx†L3116-L3146】

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
