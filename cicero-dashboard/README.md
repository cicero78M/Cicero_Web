This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Workspace note

The repository includes multiple package managers, so lockfiles from the monorepo (e.g., `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) should be left untouched when building from this dashboard package. Next.js is configured with `outputFileTracingRoot` set to the repository root (`path.join(__dirname)` in `next.config.ts`), so builds must be run from this `cicero-dashboard` directory to ensure tracing resolves modules from the correct project instead of a parent workspace.

### Dependency note

- The dashboard pins `react-d3-cloud` to version `1.0.6` with explicit overrides for its `d3-*` transitive dependencies to satisfy current security advisories while keeping React 18 compatibility. If you hit install conflicts, clear any old lockfiles or `node_modules` from earlier installs and run `npm install` again from the `cicero-dashboard` directory.
- Excel exports now use [`exceljs`](https://www.npmjs.com/package/exceljs) instead of `xlsx` to avoid open vulnerabilities reported by `npm audit` while maintaining the same download features on the user directory and Amplify export API.
- Both the user directory export and the `/api/download-amplify` route import `exceljs` from `exceljs/dist/exceljs.min.js` to ensure the browser-safe bundle is used during compilation. A custom declaration file at `types/exceljs.d.ts` keeps TypeScript happy with this path. If `next build` complains about missing `exceljs`, reinstall dependencies from this folder so the package is available to the bundler.

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

## Menu khusus Ditbinmas

Pengguna dengan `clientId` **dan** `role` bernilai `ditbinmas` akan melihat entri navigasi tambahan bertajuk **Satbinmas Official** yang mengarah ke `/satbinmas-official`. Item menu ini mengikuti gaya aktif maupun hover yang sama di sidebar utama dan tampilan sheet ketika sidebar dikompres, sehingga pengalaman navigasi tetap konsisten di semua mode.

Halaman Satbinmas Official sendiri memakai `useRequireAuth` plus validasi `client_id`/`role` Ditbinmas sehingga pengguna lain mendapat tampilan 403 sebelum diarahkan kembali ke beranda. Konten halaman dilengkapi filter global periode (harian/mingguan/bulanan/rentang), platform (All/Instagram/TikTok), serta dropdown Polres yang memengaruhi seluruh seksi: ringkasan coverage akun resmi (kartu statistik dan tabel Polres), aktivitas konten (bar chart per platform dan heatmap top 10), kualitas & engagement (total/avg likes-komentar, top 10 Polres, dan top konten), serta pola konten (leaderboard hashtag/mention) berikut state loading/error/empty.

Halaman dinamis `/satbinmas-official/[client_id]` menampilkan versi ringkas per Polres untuk Ditbinmas. Rute ini tetap memakai guard Ditbinmas dan menyajikan identitas Polres, status kelengkapan akun (lengkap/kurang/belum), tautan IG/TikTok, ringkasan angka (total posting per platform, engagement total & rata-rata, tanggal posting terakhir), grafik posting harian, serta daftar konten terbaru dengan caption singkat, hashtag, dan tautan eksternal. Insight teks juga dihitung otomatis (hari aktif terhadap total hari periode) lengkap dengan penanda apakah performa berada di atas/bawah rata-rata Polda.

### Dokumentasi Satbinmas Official

- **Tujuan halaman:** memantau kepatuhan & performa akun resmi Polres di bawah Ditbinmas melalui rangkuman kepemilikan akun, intensitas posting, kualitas engagement, dan pola konten lintas platform.
- **Persyaratan akses:** navigasi **Satbinmas Official** hanya render untuk pengguna dengan `clientId` **dan** `role` bernilai `ditbinmas`. Guard `useRequireAuth` di rute `/satbinmas-official` dan `/satbinmas-official/[client_id]` memastikan kombinasi tersebut wajib ada sebelum data dimuat.
- **Filter yang tersedia:**
  - `periode`: `harian` | `mingguan` | `bulanan` | `rentang`.
  - `tanggal` untuk hari tunggal atau `tanggal_mulai`/`tanggal_selesai` (`startDate`/`endDate`) untuk rentang kustom.
  - `platform`: `all` | `instagram` | `tiktok`.
  - `client_id` (dropdown Polres) yang mempengaruhi seluruh kartu, grafik, dan tabel.
- **Dependensi API baru:** seluruh seksi mengambil data dari backend `NEXT_PUBLIC_API_URL` melalui endpoint ber-prefiks `/api/satbinmas-official` dengan header Bearer token:
  - `GET /api/satbinmas-official/summary`: kartu statistik + tabel coverage akun.
  - `GET /api/satbinmas-official/activity`: bar chart & heatmap aktivitas.
  - `GET /api/satbinmas-official/engagement`: daftar/top list konten & metrik likes/komentar/shares/views.
  - `GET /api/satbinmas-official/hashtags`: leaderboard hashtag & mention.
  - `GET /api/satbinmas-official/accounts/:client_id`: detail per Polres untuk rute dinamis.
- **Contoh konfigurasi lingkungan:** set base URL API di `.env.local` agar fetch Satbinmas berhasil.

  ```env
  NEXT_PUBLIC_API_URL=https://api.cicero.local
  ```

- **Payload minimal yang diharapkan:** endpoint menerima query di atas dan mengembalikan minimal struktur berikut agar tampilan tidak kosong:

  ```json
  {
    "data": {
      "totals": { "accounts": 0, "active": 0, "dormant": 0, "followers": 0 },
      "coverage": [
        { "client_id": "3201", "polres": "Polres Contoh", "platform": "instagram", "handle": "@polrescontoh", "status": "lengkap", "followers": 0, "last_active": null }
      ],
      "activity": [
        { "date": "2024-05-01", "platform": "instagram", "post_count": 0, "engagement_count": 0, "client_id": "3201", "polres": "Polres Contoh" }
      ],
      "engagement": [
        { "content_id": "abc", "platform": "instagram", "polres": "Polres Contoh", "caption": "...", "posted_at": "2024-05-01T00:00:00Z", "likes": 0, "comments": 0, "shares": 0, "views": 0, "hashtags": [], "mentions": [] }
      ],
      "hashtags": [
        { "hashtag": "satbinmas", "count": 0, "platform": "instagram", "client_id": "3201" }
      ]
    }
  }
  ```

- **Helper & alur data:** pemanggilan API Satbinmas tersentralisasi di `utils/api.ts` (`getSatbinmasSummary`, `getSatbinmasActivity`, `getSatbinmasEngagement`, `getSatbinmasHashtags`, `getSatbinmasAccounts`) yang menormalisasi field berbeda dari backend. Halaman `app/satbinmas-official/page.jsx` memakai helper tersebut untuk memuat kartu ringkasan, tabel Polres, grafik aktivitas, dan leaderboard; rute dinamis `app/satbinmas-official/[client_id]/page.tsx` memakai `getSatbinmasAccounts` untuk detail per Polres. Data dari API dipropagasi ke komponen visual melalui props/contexts lokal di dalam masing-masing halaman tanpa state global tambahan sehingga mudah diikuti saat onboarding.

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
