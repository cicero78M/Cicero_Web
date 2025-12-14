This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Workspace note

The repository includes multiple package managers, so lockfiles from the monorepo (e.g., `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) should be left untouched when building from this dashboard package. Next.js is configured with `outputFileTracingRoot` set to the repository root (`path.join(__dirname)` in `next.config.ts`), so builds must be run from this `cicero-dashboard` directory to ensure tracing resolves modules from the correct project instead of a parent workspace.

### Dependency note

- The dashboard pins `react-d3-cloud` to version `1.0.6` with explicit overrides for its `d3-*` transitive dependencies to satisfy current security advisories while keeping React 18 compatibility. If you hit install conflicts, clear any old lockfiles or `node_modules` from earlier installs and run `npm install` again from the `cicero-dashboard` directory.
- Excel exports now use [`exceljs`](https://www.npmjs.com/package/exceljs) instead of `xlsx` to avoid open vulnerabilities reported by `npm audit` while maintaining the same download features on the user directory and Amplify export API.
- Both the user directory export and the `/api/download-amplify` route import `exceljs` from `exceljs/dist/exceljs.min.js` to ensure the browser-safe bundle is used during compilation. A custom declaration file at `types/exceljs.d.ts` keeps TypeScript happy with this path. If `next build` complains about missing `exceljs`, reinstall dependencies from this folder so the package is available to the bundler.
- The **Tambah User** form on the user directory now includes **PPPK** in the pangkat dropdown and validation rules so tenaga non-PNS dapat dicatat tanpa error.
- Dropdown **Satfung/Divisi** untuk pengguna baru menambahkan opsi **SUBDIT DALMAS** dan **SUBDIT GASUM** agar unit terkait dapat dipilih langsung tanpa input manual.
- Pilihan **Satfung/Divisi** juga mencakup **UNIT POLSATWA** sehingga kesatuan tersebut tersedia di dropdown tambah dan edit pengguna tanpa perlu input manual, kini dibaca langsung dari daftar opsi terpusat `utils/validateUserForm` agar validasi dan tampilan selalu selaras.

## Dashboard Likes Instagram

- Rute `/likes/instagram` dan `/likes/instagram/rekap` berbagi halaman bertab yang sama sehingga tautan ke rekap langsung membuka tab rekap tanpa redirect terpisah, sementara tab insight tetap menjadi default saat membuka rute utama.
- Selektor periode untuk insight dan rekap dibangun ulang memakai hook bersama `hooks/useLikesDateSelector.ts` yang membungkus `ViewDataSelector` serta normalisasi tanggal (today/date/month/custom range). Hook ini mencegah duplikasi state pemilihan tanggal dan menyediakan label periode siap pakai untuk laporan.
- Tab insight dan rekap menggunakan komponen terspesialisasi di `components/likes/instagram/Insight` dan `components/likes/instagram/Rekap` sehingga blok chart (ChartBox, SummaryItem) dan tampilan daftar rekap berada dalam satu namespace halaman gabungan.
- Tombol **Salin Rekap** kini tampil berdampingan dengan selektor periode di header halaman dan langsung memanggil utilitas `utils/instagramEngagement.ts` untuk membangkitkan teks WA. Pengguna Ditbinmas dapat men-switch cakupan data (client/all) tanpa berpindah halaman sebelum menyalin.
- Role `ditbinmas` kini diperlakukan sebagai direktorat penuh di hook `useInstagramLikesData`, sehingga header Instagram Engagement Insight ikut menampilkan kontrol lingkup dan label direktorat yang sama seperti halaman TikTok saat pengguna Ditbinmas masuk.
- Narasi pada ChartBox utama kini hanya muncul ketika data tidak lagi digrup per client, sehingga build Next.js tidak gagal karena prop JSX yang belum dibungkus ekspresi.
- Prop `narrative` pada ChartBox utama kini dibungkus ekspresi JSX sehingga kondisi `shouldGroupByClient` tidak lagi memicu sintaks error saat build production.
- Tab insight menambahkan blok **Quick Insight** tiga poin untuk menyoroti kepatuhan likes, prioritas perbaikan, dan kebersihan data username secara ringkas tanpa menggulir ke grafik.
- Komponen `InstagramEngagementInsightView` diekstrak ke `app/likes/instagram/InstagramEngagementInsightView.jsx` dan dipakai ulang oleh `page.jsx` serta `rekap/page.jsx` sehingga berkas page hanya mengekspor Page component default sesuai aturan Next.js.
- Header halaman insight menggunakan prop `heroContent` standar yang sama seperti halaman TikTok sehingga komponen hero (selektor periode, pemilih lingkup Ditbinmas, dan tombol salin rekap) mengikuti penamaan konsisten di `InsightLayout`.
- Hook `useInstagramLikesData` kini mendefinisikan konstanta `allowedScopeClients` satu kali di awal efek sehingga tidak ada deklarasi ganda yang memicu kegagalan build Next.js.

## Layout Insight TikTok & Instagram

- `components/InsightLayout` menyediakan latar gradasi, shell kartu hero, dan switch tab standar "Dashboard Insight"/"Rekap Detail" lewat konstanta bersama `DEFAULT_INSIGHT_TABS`. Halaman `/likes/instagram` serta `/posts/tiktok` kini berbagi wrapper ini agar pengalaman insight dan rekap terasa seragam.
- Ringkasan dan seksi konten insight memakai helper baru `components/insight/InsightSummaryCard.jsx` dan `components/insight/InsightSectionCard.jsx` untuk menjaga radius, bayangan, dan jarak yang konsisten antar kartu.
- Tab rekap detail di halaman TikTok menampilkan bio, kontak, daftar hashtag/mention teratas, dan grid posting di dalam kontainer bercahaya yang sama seperti rekap Instagram sehingga pengguna tidak perlu meninggalkan halaman insight.
- Segmen rekap detail kini dibungkus komponen standar `components/insight/DetailRekapSection.jsx` yang menyamakan judul, deskripsi, dan dekorasi latar antara tab rekap Instagram serta TikTok, sekaligus mendukung scroll otomatis lewat `sectionRef`.
- Hero, ringkasan, dan kartu quick insight pada Instagram/TikTok sekarang dirender lewat scaffold bersama `components/insight/EngagementInsightMobileScaffold.jsx` sehingga padding, tipografi, dan jarak kontrol di layar sempit seragam tanpa duplikasi markup.
- ChartBox bawaan mendapat padding responsif (p-4 → p-6) plus judul bertacking normal di mobile dan border empty state agar ruang baca tetap lega pada perangkat kecil.

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

## Halaman 404

Proyek ini menyediakan `app/not-found.tsx` sebagai fallback 404 khusus dengan tombol kembali ke dashboard utama. Next.js akan merender komponen ini ketika rute tidak ditemukan sehingga pengguna mendapatkan respons yang konsisten.

Sidebar sekarang secara eksplisit mengambil `effectiveClientType` dari konteks autentikasi ketika menghitung hak akses menu. Pendekatan ini mencegah ReferenceError selama proses prerendering halaman 404/_not-found dan memastikan logika akses Ditbinmas tetap aktif di mode statis maupun dinamis.

## Dashboard Komentar TikTok

- Hook `hooks/useTiktokCommentsData` kini selalu memfilter data ke `client_id` aktif ketika `scope` bukan "all" sehingga pengguna tetap berada pada cakupan login default, sementara opsi agregasi lintas klien tetap tersedia saat `scope` bernilai "all".
- Untuk klien bertipe **DIREKTORAT**, hook `hooks/useTiktokCommentsData` sekarang mengumpulkan task dan rekap berdasarkan `client_id` yang diberikan, bukan lagi bergantung pada kecocokan `role` di direktori pengguna. Pendekatan ini memastikan satker direktorat non-ORG menampilkan data sesuai akun login tanpa mengubah perilaku klien ORG.
- Deteksi direktorat pada `useTiktokCommentsData` kini mengenali role DITSAMAPTA, DITLANTAS, BIDHUMAS, maupun DIREKTORAT sebagai direktorat walaupun `effectiveClientType` sudah dinormalisasi menjadi ORG; jalur pengambilan data direktorat tetap aktif dan penanganan khusus Ditbinmas tidak berubah.
- Data komentar TikTok untuk klien bertipe **ORG** kini dideduplikasi berdasarkan kombinasi `client_id`, identifier (NRP/NIP/user id), maupun username/nama sehingga total user serta grafik kepatuhan tidak berlipat ganda.
- Flag `isOrgClient` diturunkan dari `effectiveClientType` agar antarmuka dapat menyembunyikan kontrol perubahan cakupan bagi pengguna bertipe ORG.
- Pengguna berperan Ditbinmas dengan `client_type` ORG (misalnya kombinasi DITSAMAPTA→BIDHUMAS) kini memuat task/post menggunakan `client_id` Ditbinmas sehingga rekap mengikuti akun induk, bukan klien login mentah.
- Pilih **scope: client** bila ingin membatasi task/post ke `client_id` Ditbinmas aktif, atau gunakan **scope: all** untuk menjangkau satker jajaran melalui pemetaan `client_id` Ditbinmas yang sama.
- Rute `/comments/tiktok/rekap` kini membuka tab rekap pada halaman insight yang sama dengan `/comments/tiktok` sehingga pengalaman rekap mengikuti standar layout insight tanpa redirect tambahan.
- Komponen berbagi `TiktokEngagementInsightView` diekstrak ke berkas terpisah di `app/comments/tiktok/TiktokEngagementInsightView.jsx` sehingga halaman `page.jsx` dan `rekap/page.jsx` hanya mengekspor Page component default sesuai aturan Next.js.
- Halaman utama `/comments/tiktok` sekarang cukup merender `TiktokEngagementInsightView` dari berkas terpisah tanpa named export lain sehingga lint Next.js mengenali Page component default dengan benar.

## Insight Engagement Instagram & TikTok

- Dropdown lingkup di halaman insight Instagram dan TikTok kini memakai istilah direktorat (`directorateScope`) serta menggunakan flag `isDirectorateRole` dan `isDirectorateScopedClient` dari hook terkait. Perubahan ini memastikan alur data dan pemilihan cakupan mengikuti status direktorat pengguna, bukan lagi terikat khusus pada client Ditbinmas.

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
