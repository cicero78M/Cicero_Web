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

Teks laporan yang disalin dari tombol **Salin Teks Rekap** pada halaman `/likes/instagram/rekap` kini menyesuaikan nama direktorat pengguna. Header akan menampilkan nama client dengan tipe **Direktorat** yang sesuai dengan peran pengguna (misalnya "Ditbinmas"), dan akan kembali ke fallback "Ditbinmas" jika nama tidak tersedia. Dengan demikian, laporan siap kirim WhatsApp langsung menggunakan identitas instansi yang tepat tanpa perlu penyuntingan manual.
