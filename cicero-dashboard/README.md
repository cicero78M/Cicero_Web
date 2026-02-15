This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Workspace note

The repository includes multiple package managers, so lockfiles from the monorepo (e.g., `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) should be left untouched when building from this dashboard package. Next.js is configured with `outputFileTracingRoot` set to the repository root (`path.join(__dirname)` in `next.config.ts`), so builds must be run from this `cicero-dashboard` directory to ensure tracing resolves modules from the correct project instead of a parent workspace.

### Executive summary data source

- Grafik **Kontribusi Kanal** di halaman ringkasan eksekutif kini memprioritaskan agregasi reach dan engagement rate yang diturunkan dari rekap bulanan (Instagram/TikTok) menggunakan helper normalisasi existing. Jika backend tidak mengirim data kanal, chart otomatis memakai derivasi reach (dari `metrics.reach`/`views`) dan engagement rate `(likes + comments) / reach` yang dihitung dari posting periode tersebut.

### Dependency note

- The dashboard pins `react-d3-cloud` to version `1.0.6` with explicit overrides for its `d3-*` transitive dependencies to satisfy current security advisories while keeping React 18 compatibility. If you hit install conflicts, clear any old lockfiles or `node_modules` from earlier installs and run `npm install` again from the `cicero-dashboard` directory.
- Excel exports now use [`exceljs`](https://www.npmjs.com/package/exceljs) instead of `xlsx` to avoid open vulnerabilities reported by `npm audit` while maintaining the same download features on the user directory and Amplify export API.
- Both the user directory export and the `/api/download-amplify` route import `exceljs` from `exceljs/dist/exceljs.min.js` to ensure the browser-safe bundle is used during compilation. A custom declaration file at `types/exceljs.d.ts` keeps TypeScript happy with this path. If `next build` complains about missing `exceljs`, reinstall dependencies from this folder so the package is available to the bundler.
- The **Tambah User** form on the user directory now includes **PPPK** in the pangkat dropdown and validation rules so tenaga non-PNS dapat dicatat tanpa error.
- User directory consumers now normalize API payloads with `extractUserDirectoryUsers` (`cicero-dashboard/utils/api.ts`) so nested response shapes like `{ data: { users: [] } }` still render on `/users`, `/user-insight`, and executive summary pages.
- Dropdown **Satfung/Divisi** untuk pengguna baru menambahkan opsi **SUBDIT DALMAS** dan **SUBDIT GASUM** agar unit terkait dapat dipilih langsung tanpa input manual.
- Pilihan **Satfung/Divisi** juga mencakup **UNIT POLSATWA** sehingga kesatuan tersebut tersedia di dropdown tambah dan edit pengguna tanpa perlu input manual, kini dibaca langsung dari daftar opsi terpusat `utils/validateUserForm` agar validasi dan tampilan selalu selaras.
- Aksi **Nonaktifkan** pada User Directory kini memakai modal konfirmasi yang mewajibkan input NRP/NIP sesuai user sebelum status diubah menjadi nonaktif (soft delete), sementara user nonaktif dapat diaktifkan kembali lewat tombol **Aktifkan kembali**.
- Tabel User Directory sekarang membungkus konten kolom sehingga data panjang tetap terbaca tanpa perlu horizontal scroll.

### User directory scope & role normalization

- Mapping role yang distandardkan untuk halaman personil berada di `utils/userDirectoryScope.ts`: `ditbinmas`, `bidhumas`, `ditsamapta`, `ditlantas`, dan `operator`. Nilai role dari token maupun data user akan dinormalisasi ke bentuk tersebut sebelum proses filter.
- Filter role juga mempertimbangkan flag boolean pada payload user (contoh `ditbinmas: true`) agar data personil yang hanya mengirimkan indikator role tetap terpetakan ke role kanonik di `filterUserDirectoryByScope`.
- `AuthContext` menormalkan role login ke bentuk kanonik (uppercase/lowercase) lewat pemetaan: `DITBINMAS`, `DITINTELKAM`, `BIDHUMAS`, `DITSAMAPTA`, `DITLANTAS`, `OPERATOR`, dan `DIREKTORAT`, sehingga `effectiveRole` menjadi sumber kebenaran untuk filter personil.
- Normalisasi role di `AuthContext` kini aman saat nilai role belum tersedia (null) sehingga efek derivasi tetap berjalan tanpa error tipe.
- `client_type` efektif menentukan scope data:
  - **DIREKTORAT:** tampilkan personil dengan role yang sama lintas `client_id`.
  - **ORG:** tampilkan personil dengan role yang sama **dan** `client_id` yang sama.
- Helper `getUserDirectoryFetchScope` memastikan permintaan data user mengikuti `client_type` efektif: ORG selalu memakai scope **ORG** walau role login direktorat, sedangkan scope **DIREKTORAT** hanya dipakai saat `client_type` memang direktorat.
- Halaman User Directory menentukan scope request dari `client_type` asli pada profil client dan memastikan role `operator` tetap difilter berdasarkan `client_id` peminta.
- Filter role pada `filterUserDirectoryByScope` otomatis di-skip bila payload user tidak memiliki sinyal role sama sekali, sehingga daftar personil ORG tetap tampil walau API hanya mengirim data dasar tanpa atribut role.
- Role direktorat (`ditbinmas`, `ditintelkam`, `bidhumas`, `ditsamapta`, `ditlantas`) hanya mengaktifkan scope **DIREKTORAT** di `filterUserDirectoryByScope` ketika `client_type` login memang direktorat; akun ORG tetap terkunci ke scope **ORG**.
- `effectiveClientType` di `AuthContext` konsisten dengan workflow directorate vs org: role operator selalu diperlakukan sebagai **ORG**, role direktorat (termasuk `DITINTELKAM`) dianggap **DIREKTORAT** hanya bila `client_type` juga direktorat, sementara kombinasi khusus DITSAMAPTA + BIDHUMAS dipaksa menjadi **ORG** agar alur data memakai role BIDHUMAS.
- Helper `filterUserDirectoryByScope` dipakai sebelum perhitungan ringkasan/chart pada halaman personil untuk memastikan summary dan visualisasi mengikuti scope yang sama.
- Tombol **Salin Rekap** di halaman `/user-insight` kini memakai header laporan yang eksplisit menyebut tujuan progres pembaruan username personil (status lengkap, kurang lengkap, dan belum update), lengkap dengan sapaan waktu, kategori cakupan, serta timestamp agar konteks laporan WhatsApp tidak ambigu.
- Halaman `/users` tidak lagi melakukan fan-out `getClientProfile` untuk seluruh `client_id` ketika login Ditbinmas; label kesatuan mengandalkan field `nama_client`/`client_name` dari payload direktori.
- Fungsi `getUserDirectory` di `utils/api.ts` sekarang menerima parameter opsional `role` dan `scope` agar backend dapat melakukan filter server-side bila tersedia. Jika backend belum mendukung, hasil tetap difilter kembali di client agar konsisten.
- Helper `getDashboardAnev` di `utils/api.ts` memanggil `/api/dashboard/anev` dengan default `time_range=7d`, menyertakan `client_id` ke query serta header `X-Client-Id`, dan memvalidasi rentang custom agar `start_date`/`end_date` terisi. Respons 403 dengan informasi tier/expiry diteruskan sebagai error guard premium, sedangkan filters dan aggregates dinormalisasi sebelum dikonsumsi UI. Payload baru `directory`/`user_directory` serta `instagram_engagement`/`tiktok_engagement` ikut dipetakan (per_user, platform, satfung/divisi, flag unmapped) supaya UI bisa langsung menautkan user_id ke engagement tanpa bergantung pada `raw`.
- Filter `scope` pada `getDashboardAnev` kini dikirim dalam huruf kecil (`org`/`direktorat`) dan permintaan akan digagalkan di sisi klien jika `role` belum tersedia, sehingga backend tidak lagi menerima request tanpa konteks sesi yang lengkap. Halaman ANEV menampilkan status “menunggu konteks sesi” sampai role/scope terisi untuk mencegah error 400.
- Halaman **/anev/polres** memakai `useRequireAuth` + guard `useRequirePremium` (tier backend **tier1**, **tier2**, atau alias **premium_1/premium_2**) dan memanggil `getDashboardAnev` untuk menampilkan snapshot filter, ringkasan agregat (total user, likes, comments, expected actions, serta posting per platform), tabel `compliance_per_pelaksana` dengan completion rate, dan feedback error 400/403 lengkap CTA daftar premium. Guard kini mengekspos status tri-state (`"loading" | "premium" | "standard" | "error"`) agar halaman menunda fetch sampai akses premium dipastikan, menampilkan placeholder saat loading, CTA ketika tier standar, serta error inline ketika validasi gagal. Opsi `redirectOnStandard` pada `useRequirePremium` dapat dimatikan untuk menampilkan CTA inline tanpa pindah halaman (dipakai di `/anev/polres`).
- UI ANEV Polres kini menampilkan segmen **Direktori user (ANEV)** serta engagement per user untuk Instagram/TikTok yang memanfaatkan data baru `directory` dan `*_engagement`. Username yang belum terpeta mendapat badge Unmapped, sementara empty state menjelaskan bahwa breakdown satfung/divisi dan agregat lama tetap jadi fallback sampai payload engagement dikirim.
- `useRequirePremium` hanya mulai mengevaluasi akses setelah profil selesai di-resolve: `hasResolvedPremium` baru aktif ketika kalkulasi `premiumTier` tuntas atau terjadi kegagalan eksplisit, dan guard menunggu sinyal tier (`premiumTier` terisi atau `premiumTierReady` bernilai `true`) sebelum memutuskan status. Redirect tetap dilakukan untuk status `standard` (tier tidak memenuhi), sedangkan status `error` hanya memunculkan toast/error tanpa redirect.
- Tombol "Daftar premium" pada guard akses **/anev/polres** kini langsung menuju halaman pendaftaran khusus Anev di `/premium/anev` agar pengguna diarahkan ke formulir yang tepat.
- Role, scope, dan regional pada **/anev/polres** kini dikunci dari `useAuth` (`effectiveRole`, `effectiveClientType` sebagai scope, dan `regionalId`), ditampilkan sebagai badge ringkas di segmen filter, serta otomatis diteruskan ke `getDashboardAnev` tanpa input manual agar request selalu mengikuti konteks login.
- Normalisasi ANEV Polres kini membaca breakdown user per satfung/divisi dari `aggregates`, `aggregates.raw`, `aggregates.totals`, `data.raw`, serta nested payload seperti `raw.data` atau `raw.aggregates`. Bentuk yang diterima bisa berupa array objek `{ satfung|division|divisi|unit|name|label|category|key, count|total|users|user|value|jumlah|personel }` maupun map objek `{ \"SATFUNG\": 12 }` atau `{ key: { satfung: \"SATFUNG\", count: 12 } }`. Semua variasi dikonversi menjadi array `{ label, count }` siap pakai untuk kartu/statistik.
- Segmen **User per Satfung/Divisi** di halaman ANEV Polres menampilkan daftar bernomor dengan badge jumlah user dan progress bar proporsional untuk tiap satfung/divisi. Ketika payload kosong, UI menampilkan empty state berbingkai dashed yang menjelaskan kebutuhan field (`user_per_satfung` atau breakdown serupa di `aggregates`/`raw`) agar dev backend tahu struktur yang diharapkan.
- Segmen **Likes Instagram per Satfung/Divisi** menormalkan data dari `aggregates.raw.instagram` (atau alias `ig`, `instagram_metrics`) maupun fallback `aggregates.totals`, mengenali struktur array atau map dengan key `satfung|division|divisi|unit|name|label` dan nilai `likes|total_likes|value|count|jumlah`. Hasil normalisasi diurutkan menurun lalu ditampilkan sebagai kartu per satfung/divisi dengan fallback teks saat data kosong.
- Blok **Naratif** pada ANEV Polres merangkai metrik utama (total pengguna, likes, komentar, completion rate, serta platform teraktif berdasar jumlah posting) menjadi paragraf pendek. Narasi hanya muncul bila ada setidaknya satu metrik, dengan fallback teks “Narasi akan muncul...” ketika data belum tersedia. Contoh keluaran: “Tercatat 1.240 pengguna aktif pada periode ini. Interaksi mencapai 8.410 likes dan 1.235 komentar. Tingkat penyelesaian tugas tercatat di 87.5%. Platform teraktif adalah INSTAGRAM dengan 320 posting.”
- Filter waktu **/anev/polres** kini berbentuk segmented pill (Today, This Week, This Month, Custom). Kalkulasi `start_date`/`end_date` untuk preset mingguan/bulanan dilakukan tepat sebelum `getDashboardAnev` dipanggil sambil tetap mengirim `time_range` ke API. Snapshot filter selalu menyorot preset aktif (termasuk fallback ke filter terapan saat API tidak mengembalikan label) dan tombol apply dinonaktifkan saat rentang custom belum lengkap.
- Segmen filter **/anev/polres** dirapikan dengan grid responsif: header menambahkan aksi reset, ringkasan terapan, badge konteks sesi (role/scope/regional) berbentuk kartu, dan informasi preset aktif sehingga hierarki visual lebih jelas, whitespace lebih lapang, serta input tanggal custom mudah diakses di desktop maupun mobile.
- Parameter `regional_id` kini ikut dikirim oleh `getUserDirectory` saat tersedia agar endpoint `/api/users/list` dapat menyaring direktori personil berdasarkan wilayah aktif.
- Insight engagement Instagram sekarang mengandalkan payload `/api/insta/rekap-likes` sebagai satu-satunya sumber data untuk chart, kartu ringkasan, dan tabel rekap, termasuk metadata client/divisi yang dibaca langsung dari rekap tanpa lookup tambahan.
- Hook `useInstagramLikesData` kini menyertakan fallback label aman ketika metadata client/divisi tidak tersedia di payload rekap, sehingga UI tetap informatif tanpa memanggil endpoint lain.
- Ringkasan engagement (total post, total user, sudah/kurang/belum like, tanpa username) selalu berasal dari field ringkasan rekap atau dihitung ulang dari daftar user rekap yang sama agar konsisten dengan data `/api/insta/rekap-likes`.
- Prioritas scope request Instagram engagement kini memihak tipe client direktorat: jika `effectiveClientType` **atau** `profile.client_type` bernilai `DIREKTORAT`, hook `useInstagramLikesData` selalu mengirim `scope=DIREKTORAT` (meski fallback sebelumnya mengembalikan ORG) agar akun direktorat seperti Ditintelkam tidak lagi menembak endpoint dengan `scope=ORG`.

## Dashboard Likes Instagram

- Rute `/likes/instagram` dan `/likes/instagram/rekap` berbagi halaman bertab yang sama sehingga tautan ke rekap langsung membuka tab rekap tanpa redirect terpisah, sementara tab insight tetap menjadi default saat membuka rute utama.
- Selektor periode untuk insight dan rekap dibangun ulang memakai hook bersama `hooks/useLikesDateSelector.ts` yang membungkus `ViewDataSelector` serta normalisasi tanggal (today/date/month/custom range). Hook ini mencegah duplikasi state pemilihan tanggal dan menyediakan label periode siap pakai untuk laporan.
- Selector periode di halaman `/likes/instagram` kini menampilkan opsi harian, mingguan (7 hari), bulanan, dan rentang tanggal khusus untuk pengguna dengan tier Tier 1/Tier 2 (alias premium_1 atau premium_2); pengguna lain tetap melihat snapshot hari ini tanpa kontrol tambahan.
- Tab insight dan rekap menggunakan komponen terspesialisasi di `components/likes/instagram/Insight` dan `components/likes/instagram/Rekap` sehingga blok chart (ChartBox, SummaryItem) dan tampilan daftar rekap berada dalam satu namespace halaman gabungan.
- Tombol **Salin Rekap** kini tampil berdampingan dengan selektor periode di header halaman dan langsung memanggil utilitas `utils/instagramEngagement.ts` untuk membangkitkan teks WA. Pengguna Ditbinmas dapat men-switch cakupan data (client/all) tanpa berpindah halaman sebelum menyalin.
- Role `ditbinmas` kini diperlakukan sebagai direktorat penuh di hook `useInstagramLikesData`, sehingga header Instagram Engagement Insight ikut menampilkan kontrol lingkup dan label direktorat yang sama seperti halaman TikTok saat pengguna Ditbinmas masuk.
- Untuk akun dengan `client_type` **DIREKTORAT** asli, tab **Dashboard Insight** dan **Rekap Detail** di `/likes/instagram` kini default ke cakupan semua satker (`scope=all`) lalu menyediakan selector `client_id` berbasis nama polres/satker (mengikuti pola `DirectorateClientSelector` seperti User Directory). Pemilihan satker memfilter grafik, kartu ringkasan, serta tabel rekap secara seragam tanpa perlu pindah halaman.
- Operator dengan `client_type` **ORG** kini memakai layout direktorat khusus pada grafik Insight Instagram tanpa mengubah sumber data rekap milik client mereka sendiri.
- Narasi pada ChartBox utama kini hanya muncul ketika data tidak lagi digrup per client, sehingga build Next.js tidak gagal karena prop JSX yang belum dibungkus ekspresi.
- Prop `narrative` pada ChartBox utama kini dibungkus ekspresi JSX sehingga kondisi `shouldGroupByClient` tidak lagi memicu sintaks error saat build production.
- Tab insight menambahkan blok **Quick Insight** tiga poin untuk menyoroti kepatuhan likes, prioritas perbaikan, dan kebersihan data username secara ringkas tanpa menggulir ke grafik.
- Total IG post untuk rekap engagement direktorat kini memakai fallback panjang array posting (`ig_posts`/`instagram_posts`) ketika field total tidak tersedia, sehingga perhitungan kepatuhan tetap akurat saat payload hanya mengirim daftar posting.
- Rekap `/likes/instagram` untuk akun direktorat kini memakai role login aktif ketika menyusun daftar satker (dari user directory maupun request scope), sehingga scope DIREKTORAT dengan role Ditbinmas tidak lagi menghasilkan rekap kosong ketika data backend tersedia.
- Komponen `InstagramEngagementInsightView` diekstrak ke `app/likes/instagram/InstagramEngagementInsightView.jsx` dan dipakai ulang oleh `page.jsx` serta `rekap/page.jsx` sehingga berkas page hanya mengekspor Page component default sesuai aturan Next.js.
- Header halaman insight menggunakan prop `heroContent` standar yang sama seperti halaman TikTok sehingga komponen hero (selektor periode, pemilih lingkup Ditbinmas, dan tombol salin rekap) mengikuti penamaan konsisten di `InsightLayout`.
- Rekap likes Instagram kini menambahkan aksi **Komplain** per pengguna yang memanggil helper `postComplaintInstagram` (`utils/api.ts`) ke endpoint `/api/dashboard/komplain/insta`, lengkap dengan status loading per user dan validasi username agar operator bisa mengirim tindak lanjut langsung dari tabel rekap.
- Tombol **Komplain** pada rekap likes Instagram mengirim payload minimal `{ user_id, username, client_id }` ke backend dan otomatis nonaktif ketika `username` kosong untuk mencegah pengiriman data yang belum lengkap.
- Hook `useInstagramLikesData` kini mendefinisikan konstanta `allowedScopeClients` satu kali di awal efek sehingga tidak ada deklarasi ganda yang memicu kegagalan build Next.js.
- Perhitungan flag ORG pada `useInstagramLikesData` kini dijalankan sebelum evaluasi direktorat agar penentuan scope tidak memakai variabel yang belum dideklarasikan.

## Layout Insight TikTok & Instagram

- `components/InsightLayout` menyediakan latar gradasi, shell kartu hero, dan switch tab standar "Dashboard Insight"/"Rekap Detail" lewat konstanta bersama `DEFAULT_INSIGHT_TABS`. Halaman `/likes/instagram` serta `/posts/tiktok` kini berbagi wrapper ini agar pengalaman insight dan rekap terasa seragam.
- Ringkasan dan seksi konten insight memakai helper baru `components/insight/InsightSummaryCard.jsx` dan `components/insight/InsightSectionCard.jsx` untuk menjaga radius, bayangan, dan jarak yang konsisten antar kartu.
- Tab rekap detail di halaman TikTok menampilkan bio, kontak, daftar hashtag/mention teratas, dan grid posting di dalam kontainer bercahaya yang sama seperti rekap Instagram sehingga pengguna tidak perlu meninggalkan halaman insight.
- Segmen rekap detail kini dibungkus komponen standar `components/insight/DetailRekapSection.jsx` yang menyamakan judul, deskripsi, dan dekorasi latar antara tab rekap Instagram serta TikTok, sekaligus mendukung scroll otomatis lewat `sectionRef`.
- Hook `useTiktokCommentsData` kini melonggarkan filter scope saat `payload.data` tidak menyertakan `client_id`/`client_name` sehingga tabel rekap tetap menampilkan user ketika backend hanya mengirim data tanpa identitas client.
- Rekap komentar TikTok kini menambahkan kolom aksi **Komplain** per user yang memanggil helper `postComplaintTiktok` (`utils/api.ts`) ke endpoint `/api/dashboard/komplain/tiktok`, lengkap dengan status loading per user dan validasi username agar operator bisa mengirim tindak lanjut langsung dari tabel rekap.
- Tombol **Komplain** pada rekap komentar TikTok mengirim payload minimal `{ user_id, username, client_id }` ke backend dan otomatis nonaktif ketika `username` kosong agar tidak mengirim komplain tanpa akun yang valid.
- Hero, ringkasan, dan kartu quick insight pada Instagram/TikTok sekarang dirender lewat scaffold bersama `components/insight/EngagementInsightMobileScaffold.jsx` sehingga padding, tipografi, dan jarak kontrol di layar sempit seragam tanpa duplikasi markup.
- `EngagementInsightMobileScaffold` kini menerima `premiumCta` agar tombol ajakan Premium bergradasi dapat memenuhi ruang kosong di header kontrol, tetap tertata rapi berdampingan dengan selector periode, lingkup, dan tombol salin rekap.
- ChartBox bawaan mendapat padding responsif (p-4 → p-6) plus judul bertacking normal di mobile dan border empty state agar ruang baca tetap lega pada perangkat kecil.

## Modul Reposter

- Rute `/reposter` kini menampilkan menu modul reposter dengan kartu ringkas untuk menuju profil pengguna, tugas official, dan tugas khusus (lihat `app/reposter/page.tsx`).
- Halaman `/reposter/login` menangani autentikasi reposter secara terpisah, mengirim POST ke `/api/auth/user-login` dengan payload `nrp` dan `password`, menyimpan token di localStorage (`reposter_token`), menyimpan ringkasan profil ke localStorage (`reposter_profile`), dan cookie `reposter_session` untuk kebutuhan guard server, serta membungkus form login dalam Suspense karena memakai `useSearchParams`.
- Form `/reposter/login` kini menampilkan ikon input, tombol tampil/sembunyikan password, serta opsi simpan username & password ke localStorage (`reposter_saved_credentials`).
- Context `ReposterAuthContext` dan hook `useRequireReposterAuth` menjaga halaman reposter tetap terlindungi tanpa bercampur dengan sesi login dashboard utama.
- Halaman `/reposter/login` dirender tanpa header dan sidebar dashboard agar pengalaman login reposter terasa lebih fokus dan tidak tercampur dengan UI modul utama.
- Middleware `cicero-dashboard/middleware.ts` mengecek cookie `reposter_session` untuk semua rute `/reposter` selain `/reposter/login` agar redirect ke login terjadi lebih awal.
- Rute `/reposter/profile`, `/reposter/tasks/official`, dan `/reposter/tasks/special` menampilkan halaman native dashboard yang menampilkan data profil, daftar tugas official, dan daftar tugas khusus berdasarkan token reposter.
- `/reposter/tasks/official` kini mengambil posting Instagram dari `GET /api/insta/posts?client_id=...`, menggabungkan `client_id` dari token/login dan profil remote (`GET /api/users/{nrp}`), lalu menyaring konten "hari ini" (waktu lokal) agar konten terbaru muncul lebih dulu.
- `/reposter/tasks/special` kini mengikuti UI/UX tugas official dan memuat posting khusus dari `GET /api/insta/posts-khusus?client_id=...` agar daftar tugas khusus tampil konsisten.
- Ringkasan tugas official di `/reposter/tasks/official` kini hanya menampilkan kartu **Total postingan** dan **Sudah dilaporkan** agar fokus pada status laporan.
- Kartu tugas official menyediakan aksi download media, share via Web Share API (HP supported), copy caption, dan tombol buka aplikasi dengan instruksi 2 langkah (paste caption + upload), serta menonaktifkan tombol Share saat Web Share API tidak tersedia sebagai fallback.
- Pengambilan profil remote untuk halaman tugas official kini dijaga per-NRP agar pemanggilan `GET /api/users/{nrp}` tidak berulang saat state auth diperbarui.
- Halaman laporan tugas official (`/reposter/tasks/official/[postId]/report`) kini menampilkan preview gambar, susunan informasi tugas berbasis kartu, serta caption yang bisa diperluas dengan tombol "Lihat selengkapnya" agar tampil lebih rapi, sekaligus menyediakan form pengiriman laporan baru.
- `/reposter/profile` kini mengambil detail user dari tabel `user` melalui endpoint Cicero_V2 (`GET /api/users/{nrp}`), menampilkan Client ID, menyediakan form edit untuk Nama, Pangkat, Satfung, Jabatan, username Instagram/TikTok, serta email dengan tombol simpan yang memanggil `PUT /api/users/{nrp}`. Profil remote yang sudah lengkap disimpan kembali ke storage reposter agar halaman lain konsisten.
- Fetch data reposter (profil, daftar tugas, dan tautan laporan) mengabaikan abort request agar error UI tidak terisi ketika user berpindah halaman atau request dibatalkan.
- Helper `utils/reposterProfile.ts` membantu menormalkan payload login + JWT untuk menampilkan data profil sesuai pengguna yang sedang login, sekaligus memprioritaskan `client_id` dari token sebelum fallback ke label client.
- Helper `utils/reposterTaskActions.ts` membungkus aksi download media, share, dan copy caption agar handler di daftar tugas reposter tetap ringkas dan UI bisa menampilkan feedback keberhasilan/gagal.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Fonts are provided via system-safe fallbacks defined in `app/globals.css` so builds remain self-contained without downloading assets from Google Fonts.

### Build cleanup

Jika build Next.js menemui error chunk hilang seperti `Cannot find module './5611.js'`, jalankan build dari folder `cicero-dashboard` dengan script `npm run build` yang kini otomatis membersihkan folder `.next` terlebih dahulu. Anda juga bisa menjalankan `npm run clean` secara manual untuk menghapus artifact build sebelum mencoba ulang.

## Halaman 404

Proyek ini menyediakan `app/not-found.tsx` sebagai fallback 404 khusus dengan tombol kembali ke dashboard utama. Next.js akan merender komponen ini ketika rute tidak ditemukan sehingga pengguna mendapatkan respons yang konsisten.

Sidebar sekarang secara eksplisit mengambil `effectiveClientType` dari konteks autentikasi ketika menghitung hak akses menu. Pendekatan ini mencegah ReferenceError selama proses prerendering halaman 404/_not-found dan memastikan logika akses Ditbinmas tetap aktif di mode statis maupun dinamis.

## Premium CICERO

- Halaman **/premium** merangkum fitur paket premium (recap WA Bot, jadwal 15:00/18:00/20:30, ANEV harian/mingguan/bulanan/kustom, unduhan Excel, dan panduan operator) dengan tombol **Daftar Sekarang** ke **/premium/register**.
- Formulir **/premium/register** kini form terkontrol yang menghitung nominal unik setelah paket dipilih, memvalidasi paket premium + detail bank, mengirim payload melalui helper `submitPremiumRequest` (`cicero-dashboard/utils/api.ts`), serta menampilkan status loading/sukses sambil mengunci form setelah pengajuan berhasil. Form tidak lagi menampilkan atau memvalidasi `username`/`Client ID`.
- Form **/premium/register** juga memuat context permintaan dari endpoint **`/api/premium/request/latest`** untuk mengisi ulang identifier `dashboard_user_id`/`user_id`, status permintaan, `request_id`, serta nominal unik langsung dari backend. Jika backend menandai status `pending/processing/waiting_payment`, UI otomatis mengunci form dan menampilkan pesan alasan kunci agar nominal unik tidak berubah saat verifikasi.
- Pengajuan **/premium/register** mengirim POST ke backend **`/api/premium/request`** dengan field yang diterima server: `premium_tier`, `bank_name`, `sender_name`, `account_number`, `unique_code` (suffix acak), `request_id`/`premium_request_id` bila tersedia dari context, nominal unik yang dikirim sebagai `transfer_amount` dan `amount`, serta identifier opsional `dashboard_user_id` atau `user_id` bila tersedia. Contoh payload:
  ```json
  {
    "premium_tier": "premium_2",
    "bank_name": "BRI",
    "sender_name": "Anjani",
    "account_number": "9876543210",
    "unique_code": "381",
    "request_id": "req_01J0EXAMPLE",
    "transfer_amount": 200381,
    "amount": 200381,
    "dashboard_user_id": "dash_123",
    "user_id": "user_123"
  }
  ```
  Alur pengguna: pilih paket (nominal unik dikalkulasi otomatis) → isi rekening & nama pengirim → submit (nominal unik terkunci dan dikirim bersama identifier login) → verifikasi pembayaran/nominal oleh tim dengan instruksi transfer ke **0891758684 (BCA a.n Rizqa Febryan Prastyo)** dan catatan nama pengirim untuk mempercepat verifikasi. QA tidak perlu mencari field `username`/`Client ID` karena sudah dihapus dari form dan payload.
- Menu **Premium** di sidebar/dashboard serta tombol **Premium** pada header insight Instagram dan TikTok hanya muncul untuk pengguna dengan `client_type` **ORG** selain role **Operator**, sehingga akun direktorat dan operator ORG tidak melihat CTA paket premium.

## Dashboard Utama

- Halaman `/dashboard` menormalkan bentuk respons aggregator terbaru dan melakukan fallback ke endpoint rapid Instagram/TikTok (`/api/insta/rapid-profile`, `/api/insta/rapid-posts`, `/api/tiktok/rapid-profile`, `/api/tiktok/rapid-posts`) sehingga kartu highlight tetap menampilkan data akun resmi meski struktur response aggregator berubah atau kosong.【F:app/dashboard/page.tsx†L1-L223】
- Pemanggilan helper backend untuk profil dan posting Instagram/TikTok sekarang menerima token autentikasi yang sudah dipastikan tersedia lebih dulu, sehingga build tidak lagi gagal karena argumen token bertipe `null` ketika data aggregator diambil.【F:app/dashboard/page.tsx†L240-L378】

## Dashboard Komentar TikTok

- Insight TikTok kini mendukung selector cakupan direktorat (client/all) seperti Instagram, memanfaatkan opsi `scope` di hook `useTiktokCommentsData` dan meneruskan `scopeSelectorProps` ke scaffold mobile agar kontrol tampil konsisten.
- Quick insight TikTok kini menampilkan persentase kebutuhan aksi dan kelengkapan username berdasarkan jumlah user valid agar narasi kepatuhan konsisten dengan format Instagram.
- ChartBox pada insight komentar TikTok kembali memakai gaya default seperti Instagram, sehingga state kosong dan dekorasi latar mengikuti komponen bawaan tanpa override khusus.
- Hook `hooks/useTiktokCommentsData` kini selalu memfilter data ke `client_id` aktif ketika `scope` bukan "all" sehingga pengguna tetap berada pada cakupan login default, sementara opsi agregasi lintas klien tetap tersedia saat `scope` bernilai "all".
- Saat scope direktorat berada pada mode `client`, data chart TikTok kini disusun ulang dari daftar user yang sudah difilter `client_id` agar grafik hanya memuat personel direktorat yang dipilih.
- Untuk klien bertipe **DIREKTORAT**, hook `hooks/useTiktokCommentsData` sekarang mengumpulkan task dan rekap berdasarkan `client_id` yang diberikan, bukan lagi bergantung pada kecocokan `role` di direktori pengguna. Pendekatan ini memastikan satker direktorat non-ORG menampilkan data sesuai akun login tanpa mengubah perilaku klien ORG.
- Deteksi direktorat pada `useTiktokCommentsData` mengikuti `effectiveClientType`: akun ORG tidak lagi memakai jalur direktorat walau role bertipe direktorat, sehingga scope dan pemanggilan profil klien terkunci ke `client_id` login.
- Data komentar TikTok untuk klien bertipe **ORG** kini dideduplikasi berdasarkan kombinasi `client_id`, identifier (NRP/NIP/user id), maupun username/nama sehingga total user serta grafik kepatuhan tidak berlipat ganda.
- Flag `isOrgClient` diturunkan dari `effectiveClientType` agar antarmuka dapat menyembunyikan kontrol perubahan cakupan bagi pengguna bertipe ORG.
- Chart dan ringkasan rekap TikTok Engagement Insight kini sepenuhnya bersumber dari endpoint `/api/tiktok/rekap-komentar` (termasuk parameter `role`, `scope`, dan `regional_id`), sehingga total user/distribusi status serta total post tidak lagi mengambil fallback dari dashboard stats.
- Endpoint `/api/tiktok/rekap-komentar` kini menerima filter rentang tanggal melalui `tanggal_mulai`/`tanggal_selesai` berikut alias `start_date`/`end_date`, sehingga penyaringan periode mengikuti pola rekap likes Instagram dan dashboard stats tanpa memutus integrasi adapter yang masih memakai nama field lama.

## Dashboard Amplify

- `getRekapAmplify` di `utils/api.ts` kini menerima opsi `role`, `scope`, dan `regional_id` agar permintaan `/api/amplify/rekap` dapat mengikuti cakupan direktorat/ORG serta filter regional jika tersedia.
- `getRekapAmplify` juga menerima `AbortSignal` agar halaman Amplify bisa membatalkan request saat parameter berubah atau komponen unmount.
- Parameter rentang tanggal pada rekap amplify kini memakai `tanggal_mulai`/`tanggal_selesai`, mengikuti pola endpoint insight lain yang mengandalkan format tanggal backend yang sama.
- `AuthContext` mengekspose `regionalId` hasil pembacaan profil klien sehingga halaman Amplify dapat meneruskan informasi regional ke API bila diperlukan.
- Hook `useTiktokCommentsData` menormalkan `effectiveClientType` kosong/null menjadi `undefined` sebelum menghitung `directoryScope`, sehingga pemetaan scope tidak memicu error tipe saat nilai dari autentikasi belum tersedia.
- Akun bertipe **ORG** selalu memakai `client_id` login untuk mengambil statistik, profil, dan rekap komentar sehingga tidak ada fan-out `getClientProfile` berdasarkan daftar `client_id`.
- Perhitungan `orgClient` kini dilakukan sebelum menentukan flag direktorat di `useTiktokCommentsData`, sehingga hasil build tidak gagal karena akses nilai sebelum deklarasi.
- Rute `/comments/tiktok/rekap` kini membuka tab rekap pada halaman insight yang sama dengan `/comments/tiktok` sehingga pengalaman rekap mengikuti standar layout insight tanpa redirect tambahan.
- Komponen berbagi `TiktokEngagementInsightView` diekstrak ke berkas terpisah di `app/comments/tiktok/TiktokEngagementInsightView.jsx` sehingga halaman `page.jsx` dan `rekap/page.jsx` hanya mengekspor Page component default sesuai aturan Next.js.
- Halaman utama `/comments/tiktok` sekarang cukup merender `TiktokEngagementInsightView` dari berkas terpisah tanpa named export lain sehingga lint Next.js mengenali Page component default dengan benar.
- `AuthContext` kini mengekstrak dan menyimpan `premium_tier` serta tanggal kedaluwarsa premium (`premium_expiry`/`expires_at`) dari profil client, kemudian membagikannya lewat `useAuth`. Guard `hooks/useRequirePremium` memblokir/redirect halaman ANEV bila tier bukan `tier1`, `tier2`, atau alias `premium_1`/`premium_2` dan baru dievaluasi setelah profil selesai di-resolve: `hasResolvedPremium` menyala ketika kalkulasi `premiumTier` tuntas atau terjadi kegagalan eksplisit, dan guard tetap menunggu sinyal tier (`premiumTier` terisi atau `premiumTierReady` bernilai `true`) sebelum memutuskan redirect. Menu sidebar selalu mengarah ke rute **/anev/polres** (label tetap menandai status premium ketika akses belum tersedia). Rute lama `/dashboard/anev` otomatis mengarahkan ke halaman ANEV agar tautan lama tetap berfungsi.
- Nilai tier premium dinormalisasi ke huruf kecil serta menghapus spasi, garis bawah, maupun tanda hubung sehingga variasi seperti `Premium 1`, `premium-1`, `premium_1`, `premium1`, maupun `tier 1` dianggap setara. Akses ANEV Polres diberikan untuk tier `tier1`/`premium_1` maupun `tier2`/`premium_2`; nilai lain akan diarahkan ke halaman Premium melalui guard, sementara menu sidebar tetap menunjuk ke rute Anev Polres yang dilindungi.

## Insight Engagement Instagram & TikTok

- Dropdown lingkup di halaman insight Instagram dan TikTok kini memakai istilah direktorat (`directorateScope`) serta menggunakan flag `isDirectorateRole` dan `isDirectorateScopedClient` dari hook terkait. Perubahan ini memastikan alur data dan pemilihan cakupan mengikuti status direktorat pengguna, bukan lagi terikat khusus pada client Ditbinmas.
- `useInstagramLikesData` kini memisahkan status untuk **layout direktorat** (`isDirectorateLayout`) dan **data direktorat** (`isDirectorateData`). Akun operator bertipe ORG tetap memakai jalur data non-direktorat (`getRekapLikesIG`) dengan `client_id` login, sementara tampilan bisa mengikuti layout direktorat tanpa melakukan agregasi lintas client atau pemanggilan `getUserDirectory`.
- Selektor periode pada insight Instagram kembali tampil dengan opsi harian/mingguan/bulanan/rentang tanggal untuk pengguna Tier 1/Tier 2 (alias premium_1 atau premium_2); pengguna lain tetap terkunci ke “Hari ini” tanpa kontrol tambahan. Insight TikTok kini mengikuti pola yang sama—pengguna Tier 1/2 dapat memilih harian, mingguan, bulanan, atau rentang tanggal, sementara tier lain tetap melihat snapshot harian.

## Menu khusus Ditbinmas

Pengguna dengan `clientId` **dan** `role` bernilai `ditbinmas` akan melihat entri navigasi tambahan bertajuk **Satbinmas Official** yang mengarah ke `/satbinmas-official`. Item menu ini mengikuti gaya aktif maupun hover yang sama di sidebar utama dan tampilan sheet ketika sidebar dikompres, sehingga pengalaman navigasi tetap konsisten di semua mode.

Menu **Weekly Report** sebelumnya tersedia khusus untuk Ditbinmas, namun kini dihilangkan dari sidebar dan rute `/weekly-report` sudah tidak dapat diakses. Dengan begitu navigasi Ditbinmas lebih fokus pada ringkasan eksekutif dan laporan Satbinmas tanpa halaman mingguan terpisah.

Halaman Satbinmas Official sendiri memakai `useRequireAuth` plus validasi `client_id`/`role` Ditbinmas sehingga pengguna lain mendapat tampilan 403 sebelum diarahkan kembali ke beranda. Konten halaman dilengkapi filter global periode (harian/mingguan/bulanan/rentang), platform (All/Instagram/TikTok), serta dropdown Polres yang memengaruhi seluruh seksi: ringkasan coverage akun resmi (kartu statistik dan tabel Polres), aktivitas konten (bar chart per platform dan heatmap top 10), kualitas & engagement (total/avg likes-komentar, top 10 Polres, dan top konten), serta pola konten (leaderboard hashtag/mention) berikut state loading/error/empty.

Seksi **Tren harian** menambahkan agregasi `useMemo` per tanggal untuk likes, komentar, jumlah posting, dan total engagement (likes + komentar). Data yang sudah diurutkan ini divisualisasikan lewat stacked bar likes vs komentar dan bar chart volume posting harian, termasuk empty state ketika tidak ada konten yang lolos filter.

Seksi **Ringkasan cepat akun** merangkum setiap kombinasi Polres + platform beserta display name, handle, status verifikasi, total posting periode terpilih, total likes & komentar, serta rata-rata engagement per posting. Data diambil dari agregasi konten yang difilter dan dipadankan dengan metadata akun agar tim Ditbinmas dapat langsung melihat kanal mana yang paling aktif maupun yang belum berverifikasi tanpa menggulirkan tabel lain.

Halaman dinamis `/satbinmas-official/[client_id]` menampilkan versi ringkas per Polres untuk Ditbinmas. Rute ini tetap memakai guard Ditbinmas dan menyajikan identitas Polres, status kelengkapan akun (lengkap/kurang/belum), tautan IG/TikTok, ringkasan angka (total posting per platform, engagement total & rata-rata, tanggal posting terakhir), grafik posting harian, serta daftar konten terbaru dengan caption singkat, hashtag, dan tautan eksternal. Insight teks juga dihitung otomatis (hari aktif terhadap total hari periode) lengkap dengan penanda apakah performa berada di atas/bawah rata-rata Polda.
Props halaman kini menggunakan objek `params` biasa (tanpa `Promise`) sesuai konvensi Next.js sehingga penurunan `client_id` tetap konsisten saat build.

### Halaman Satbinmas Official

- **Tujuan:** Menyediakan dashboard terpusat bagi Ditbinmas untuk memantau coverage akun resmi, aktivitas konten, dan kualitas engagement Polres di platform Instagram/TikTok. Statistik dan tabel dirancang agar pengawas bisa langsung melihat kepatuhan kanal resmi serta performa tiap Polres tanpa harus membuka laporan terpisah.
- **Persyaratan akses:** Hanya pengguna yang memiliki `client_id` **dan** `role` bernilai `ditbinmas` yang dapat membuka menu Satbinmas Official. Guard `useRequireAuth` memblokir akses lainnya dan menampilkan 403 sebelum mengarahkan kembali ke beranda.
- **Filter tersedia:**
  - Periode umum (harian, mingguan, bulanan, atau rentang tanggal) melalui kombinasi `periode`, `tanggal`/`tanggal_mulai`/`tanggal_selesai`.
  - Platform `All`/`Instagram`/`TikTok`.
  - Dropdown Polres yang meneruskan `client_id` ke semua permintaan data.
- **Dependensi API:** Seluruh seksi halaman memanggil endpoint Satbinmas baru yang di-wrap di `utils/api.ts`: `GET /api/satbinmas-official/summary`, `GET /api/satbinmas-official/activity`, `GET /api/satbinmas-official/engagement`, `GET /api/satbinmas-official/hashtags`, serta `GET /api/satbinmas-official/accounts/{client_id}`. Tiap fungsi menggunakan helper `buildSatbinmasQuery` untuk membangun query string konsisten berdasarkan filter.

Contoh konfigurasi lingkungan dan payload minimal yang diharapkan:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.cicero.example.com
```

Nilai `NEXT_PUBLIC_API_URL` wajib diisi. Jika kosong, dashboard akan menghentikan permintaan lebih awal dan menampilkan pesan kesalahan agar tidak lagi jatuh ke rute Next.js bawaan yang memicu error "failed to find server action".

```json
// GET /api/satbinmas-official/summary
{
  "data": {
    "totals": { "accounts": 12, "active": 8, "dormant": 4, "followers": 15000 },
    "coverage": [
      {
        "client_id": "POLRES_01",
        "polres": "Polres Contoh",
        "platform": "instagram",
        "handle": "@polres_contoh",
        "status": "lengkap",
        "followers": 12000,
        "last_post_date": "2024-05-10"
      }
    ]
  }
}

// GET /api/satbinmas-official/activity
{
  "data": [
    { "date": "2024-05-10", "platform": "instagram", "posts": 5, "engagement": 320, "client_id": "POLRES_01", "polres": "Polres Contoh" }
  ]
}

// GET /api/satbinmas-official/engagement
{
  "data": [
    {
      "content_id": "POST_001",
      "platform": "instagram",
      "polres": "Polres Contoh",
      "caption": "Kegiatan patroli",
      "posted_at": "2024-05-10T07:00:00Z",
      "likes": 120,
      "comments": 15,
      "shares": 3,
      "views": 900,
      "hashtags": ["#satbinmas"],
      "mentions": ["@polres_contoh"]
    }
  ]
}

// GET /api/satbinmas-official/hashtags
{
  "data": [
    { "hashtag": "#satbinmas", "count": 12, "platform": "instagram", "client_id": "POLRES_01" }
  ]
}

// GET /api/satbinmas-official/accounts/{client_id}
{
  "data": [
    {
      "id": "ACC_001",
      "client_id": "POLRES_01",
      "platform": "tiktok",
      "handle": "@polres_contoh_tiktok",
      "status": "lengkap",
      "followers": 3000,
      "last_post_date": "2024-05-09",
      "polres": "Polres Contoh"
    }
  ]
}
```

### Catatan onboarding helper

- Helper query Satbinmas (`buildSatbinmasQuery`) dan fungsi fetch terkait berada di `utils/api.ts`. Data filter (periode, platform, `client_id`, rentang tanggal) diteruskan dari komponen filter utama di halaman `app/satbinmas-official/page.jsx` ke helper ini sebelum memukul endpoint terkait, memastikan semua seksi (ringkasan coverage, aktivitas, engagement, hashtag, dan detail akun) memakai parameter yang sama.

## Alur klaim & validasi email

Klaim data pengguna dilakukan melalui halaman `app/claim/page.jsx` dengan langkah berikut:

1. Pengguna memasukkan **NRP** dan **email** lalu menekan tombol **Kirim Kode OTP**.
2. Frontend memanggil fungsi `checkClaimEmailStatus` (`utils/api.ts`) yang menembak endpoint `POST /api/claim/validate-email` untuk memastikan alamat email dapat menerima pesan.
3. Hanya status **`deliverable`** yang diperbolehkan melanjutkan permintaan OTP. Jika status lain diterima, proses dihentikan dan pesan berikut ditampilkan kepada pengguna:
   - `inactive`: email tidak aktif atau sudah tidak bisa menerima pesan.
   - `domain_not_found`: domain email salah/ tidak ditemukan.
   - `mailbox_full`: kotak masuk penuh sehingga OTP tidak bisa dikirim.
   - Status tak dikenal: pengguna diminta memeriksa kembali alamat email atau mencoba lagi.
4. Jika validasi berhasil, aplikasi memanggil `requestClaimOtp` untuk mengirim kode verifikasi dan menyimpan NRP/email di `sessionStorage` sebelum mengarahkan ke halaman OTP.

### Penanganan pesan error di halaman klaim

- Ketika backend mengembalikan respons error (misalnya kombinasi NRP/email tidak cocok atau permintaan OTP ditolak), pesan dari backend diteruskan apa adanya ke pengguna agar lebih mudah dipahami.
- Kesalahan jaringan atau respons tanpa pesan akan menampilkan fallback berbahasa Indonesia seperti "Gagal terhubung ke server" atau "Gagal mengirim OTP".

Catatan untuk pengembang:

- Endpoint `POST /api/claim/validate-email` diharapkan mengembalikan `status` (`deliverable`, `inactive`, `domain_not_found`, `mailbox_full`, dll), `success`, dan `message` opsional.
- Jika endpoint gagal dihubungi atau mengembalikan error, pengguna akan melihat pesan fallback “Validasi email gagal…”.

## Prioritas urutan personel pada rekap engagement

Untuk memastikan pejabat tertentu selalu tampil teratas pada halaman rekap engagement, utilitas `prioritizeUsersForClient` (`utils/userOrdering.ts`) akan memindahkan nama dalam daftar prioritas—seperti **DADANG WIDYO PRABOWO,S.I.K**—ke urutan pertama ketika data rekap dimuat. Perubahan ini berlaku lintas halaman rekap likes Instagram dan komentar TikTok sehingga nama prioritas langsung terlihat tanpa harus menggulir daftar.

## Header laporan rekap likes Instagram

Teks laporan yang disalin dari tombol **Salin Teks Rekap** pada tab rekap halaman `/likes/instagram` menyesuaikan nama direktorat pengguna. Header akan menampilkan nama client dengan tipe **Direktorat** yang sesuai dengan peran pengguna (misalnya "Ditbinmas"), dan akan kembali ke fallback "Ditbinmas" jika nama tidak tersedia. Dengan demikian, laporan siap kirim WhatsApp langsung menggunakan identitas instansi yang tepat tanpa perlu penyuntingan manual.
