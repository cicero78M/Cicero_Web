# Cicero Web

This repository contains a Next.js dashboard used for visualizing data from the Cicero backend. The application resides in the `cicero-dashboard` directory.

For detailed instructions on setting up a production server and deploying the dashboard, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Directory Overview

```
Cicero_Web/
├── cicero-dashboard/   # Next.js application
├── docs/               # Supplementary documentation
├── LICENSE             # Project license
└── README.md           # This file
```

Inside `cicero-dashboard` you will find the typical Next.js project layout:

- `app/` – application pages and layouts
- `components/` – shared React components
- `context/` – React context providers for shared state (e.g. authentication)
- `hooks/` – custom React hooks
- `lib/` – small utility modules and shared assets
- `utils/` – helper functions and API utilities
- `__tests__/` – Jest unit tests

## Feature Highlights

### Instagram Engagement Insight (Absensi Likes IG)

- `useInstagramLikesData` mengorkestrasi pengambilan data likes Instagram berdasarkan rentang waktu yang dipilih dan hanya memanggil `/api/insta/rekap-likes` melalui `getRekapLikesIG`. Ringkasan absensi langsung memakai `summary.*`, `usersCount`, `sudahUsersCount`, `kurangUsersCount`, `belumUsersCount`, `noUsernameUsersCount`, serta `totalPosts` dari payload rekap tanpa menghitung ulang status di frontend.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L1-L500】
- Jika role pengguna adalah Ditbinmas, hook akan memanggil `fetchDitbinmasAbsensiLikes` untuk menggabungkan rekap lintas Polres sehingga satu tampilan menggambarkan kepatuhan seluruh jaringan.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L42-L113】【F:cicero-dashboard/utils/absensiLikes.ts†L1-L120】
- Untuk role lain, hook menormalisasi `client_id` aktif dan tipe klien untuk membedakan direktorat vs ORG. Klien direktorat mendapat dropdown lingkup yang membatasi rekap ke satker aktif saat `scope: "client"` atau menggabungkan seluruh jajaran saat `scope: "all"`, sementara klien ORG selalu difilter ke `client_id` login. Chart/tabel memakai `rekapRes.chartData` bila tersedia; jika tidak, daftar user berasal dari `rekapRes.data` (atau `rekapRes.users`), lalu hanya dipakai untuk tampilan tanpa menghitung ulang status likes di frontend.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L97-L520】【F:cicero-dashboard/app/likes/instagram/page.jsx†L1-L160】
- Tombol "Copy Rekap" menggunakan `buildInstagramRekap` dari modul `utils/instagramEngagement.ts` untuk membangkitkan pesan WA siap kirim yang berisi rekapitulasi per klien dan cakupan Ditbinmas terpilih.【F:cicero-dashboard/app/likes/instagram/page.jsx†L121-L200】【F:cicero-dashboard/utils/instagramEngagement.ts†L71-L120】

### Amplifikasi Link Insight

- Halaman `/amplify` kini menggunakan `InsightLayout`, `EngagementInsightMobileScaffold`, dan `DetailRekapSection` agar alur insight/rekap konsisten dengan standar Instagram Engagement Insight.
- Tombol **Salin Rekap** memanfaatkan `buildAmplifyRekap` untuk menyiapkan ringkasan amplifikasi link yang siap dibagikan ke kanal koordinasi.

### Knowledge Base Pages

- Navigasi sidebar kini menambahkan tautan ke `/mekanisme-absensi` dan `/panduan-sop` sebagai pusat informasi SOP dan alur absensi digital.【F:cicero-dashboard/components/Sidebar.jsx†L1-L120】
- Halaman `mekanisme-absensi` merangkum aktor utama, alur kerja, matriks RACI, serta istilah integrasi penting yang menopang sistem absensi.【F:cicero-dashboard/app/mekanisme-absensi/page.jsx†L1-L320】
- Halaman `panduan-sop` berisi prosedur registrasi, update data via WA bot, panduan operator, FAQ shadowban, hingga SOP pelaksanaan likes dan komentar.【F:cicero-dashboard/app/panduan-sop/page.jsx†L1-L320】

## Installation

1. Ensure [Node.js](https://nodejs.org/) (version 20 LTS) and `npm` are installed.
2. Install dependencies from within the dashboard directory:

```bash
cd cicero-dashboard
npm install
```

## Dependency Notes

- The dashboard uses `react-d3-cloud@^1.0.6`, which is compatible with React 18 and ensures the `WordCloudChart` component continues to import the library without API changes. After updating this dependency, regenerate `package-lock.json` from inside `cicero-dashboard` to capture the refreshed peer set.

## Starting the App

Run the development server with:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).
For a production build, run:

```bash
npm run build
npm start
```

To keep the production server running after you log out, use [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start "npm start" --name cicero-web
pm2 status    # verify the process is online
pm2 logs      # stream runtime logs
pm2 save      # persist the process list across reboots
```

After code updates, redeploy with:

```bash
pm2 restart cicero-web
```

## Environment Variables

Create a `.env.local` file inside `cicero-dashboard` and define the following variable (a ready-to-copy template lives in `cicero-dashboard/.env.example`):

```bash
NEXT_PUBLIC_API_URL=<backend base url>
```

`NEXT_PUBLIC_API_URL` specifies the Cicero API endpoint that the dashboard will use and is required for all API calls.
If the variable is missing, the dashboard will refuse to send requests and surface a clear error instead of falling back to the Next.js server (which can trigger "failed to find server action" messages).

## Usage Notes

- The login page expects a valid API endpoint provided by `NEXT_PUBLIC_API_URL`.
- Pages under the `app/` directory automatically refresh during development when files are edited.
- Static assets such as icons reside in `cicero-dashboard/public`.
- The backend no longer restricts how many users can log in at once.
- Clients may allow an unlimited number of concurrent sessions.
- Terms of Service and Privacy Policy for Google sign-in are available at `/terms-of-service` and `/privacy-policy`.
- For Google OAuth verification, `docs/google_auth_policies.md` also includes a short description of the application.
- Opsi registrasi dashboard untuk field role dan client saat ini mencakup OPERATOR, DITBINMAS, DITINTELKAM, DITLANTAS, DITSAMAPTA, serta BIDHUMAS sesuai daftar pilihan pada formulir registrasi.【F:cicero-dashboard/app/login/page.jsx†L539-L583】
- Gunakan halaman `/mekanisme-absensi` dan `/panduan-sop` sebagai referensi cepat saat melakukan pelatihan atau audit SOP digital.【F:cicero-dashboard/app/mekanisme-absensi/page.jsx†L1-L320】【F:cicero-dashboard/app/panduan-sop/page.jsx†L1-L320】
- Status autentikasi kini memiliki fase hidrasi: `AuthProvider` menandai `isHydrating` saat membaca token dari `localStorage`, sehingga hook seperti `useRequireAuth` menunggu sebelum mengalihkan pengguna. Rute terlindungi terakhir akan disimpan sebagai `last_pathname` (kecuali halaman publik seperti `/`, `/login`, `/claim`) dan dipakai `useAuthRedirect` untuk mengirim pengguna kembali ke halaman sebelumnya setelah login, dengan fallback ke `/dashboard`.
- Role DITSAMAPTA dengan tipe klien DIREKTORAT dan role BIDHUMAS kini dinormalisasi menjadi `effectiveClientType: "ORG"` dan `effectiveRole: "BIDHUMAS"` di `AuthContext`. Nilai terderivasi ini diekspos lewat `useAuth` dan dipakai navigasi (mis. Sidebar) sehingga menu yang muncul selaras dengan organisasi induk BIDHUMAS tanpa mengubah nilai asli dari backend.【F:cicero-dashboard/context/AuthContext.tsx†L6-L89】【F:cicero-dashboard/components/Sidebar.jsx†L24-L76】
- Sidebar kini memeriksa override `effectiveClientType`/`effectiveRole` sebelum menyembunyikan menu **Instagram Engagement Insight** atau **TikTok Engagement Insight**, memastikan tautan tetap terlihat bagi kombinasi DITSAMAPTA–BIDHUMAS yang dipetakan ulang ke BIDHUMAS meski status klien mentah menandai fitur tersebut sebagai nonaktif.【F:cicero-dashboard/components/Sidebar.jsx†L32-L86】
- Jalur rekap likes Ditbinmas sekarang menerima `effectiveClientId` sehingga kasus khusus DITSAMAPTA BIDHUMAS bisa mengambil direktori, profil, dan rekap melalui klien BIDHUMAS tanpa mengubah perilaku Ditbinmas lain. Hook `useInstagramLikesData` otomatis meneruskan pemetaan ini ketika mendeteksi kombinasi tersebut.【F:cicero-dashboard/utils/absensiLikes.ts†L1-L125】【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L39-L151】
- Halaman **User Directory** dan **User Insight** kini memprioritaskan `effectiveClientType` dari konteks autentikasi ketika menentukan apakah suatu akun bertipe direktorat. Kombinasi DITSAMAPTA dengan role BIDHUMAS diperlakukan sebagai klien ORG, sehingga daftar user, rekap, dan statistik tetap menggunakan `client_id` DITSAMAPTA tanpa menarik data agregat direktorat.【F:cicero-dashboard/app/users/page.jsx†L120-L189】【F:cicero-dashboard/app/user-insight/page.jsx†L16-L115】

### TikTok Post Insight

- Tab insight/rekap TikTok kini memiliki dropdown **Lingkup** untuk peran Ditbinmas dan direktorat yang memenuhi syarat, membatasi rekap ke klien aktif atau menjangkau seluruh satker jajaran tanpa meninggalkan halaman analitik.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L26-L120】
- Tombol **Salin Rekap** memanggil utilitas `buildTiktokPostRekap` agar ringkasan performa (frekuensi unggahan, rata-rata views/likes/komentar/share, engagement rate, top 3 post) siap ditempel ke WhatsApp/rapat tanpa menyalin manual.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L250-L329】【F:cicero-dashboard/utils/tiktokPostRekap.ts†L1-L76】
- Bagian rekap mendapatkan komponen `RekapTiktokPosts` yang menghadirkan tabel caption, tanggal, dan metrik per post dengan pencarian serta pagination ringan, lengkap narasi kontekstual sesuai periode dan cakupan dipilih.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L360-L470】【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L1-L170】

## Documentation

Additional documents live under the [`docs/`](docs) directory:

- [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) – server setup and deployment workflow
- [`executive_summary.md`](docs/executive_summary.md) – high-level architecture across repositories
- [`ATTENDANCE.md`](docs/ATTENDANCE.md) – alur absensi digital, logika rekap likes, dan hubungannya dengan WA Bot
- [`google_auth_policies.md`](docs/google_auth_policies.md) – Google OAuth terms and privacy policy links
- [`auth-navigation.md`](docs/auth-navigation.md) – ringkasan alur hidrasi autentikasi dan pemulihan rute terakhir
- [`google_contacts_service_account.md`](docs/google_contacts_service_account.md) – panduan penempatan `credentials.json` untuk layanan Google Contacts di backend Cicero_V2
- [`amplify-insight.md`](docs/amplify-insight.md) – standar UI/UX dan alur kerja Amplifikasi Link Insight

For more information about Next.js features, refer to the documentation inside `cicero-dashboard/README.md`.


## Instagram Post Analysis API

The Instagram Post Analysis page retrieves Instagram analytics from the backend. Data is fetched via `getInstagramProfileViaBackend` and `getInstagramPostsViaBackend` in `cicero-dashboard/utils/api.js`.

### Profile Fields
- `username`
- `followers`
- `following`
- `bio`

### Post Fields
- `id`
- `created_at`
- `type`
- `caption`
- `like_count`
- `comment_count`
- `share_count`
- `view_count` (optional)
- `thumbnail` (optional)

These fields are provided by the backend endpoints `/api/insta/rapid-profile` and `/api/insta/rapid-posts`.

Thumbnails from Instagram occasionally use the `.heic` extension which many browsers
cannot display. The frontend automatically replaces `.heic` with `.jpg` and falls
back to `/file.svg` if loading fails.

The dashboard provides a single Instagram Post Analysis page at `/instagram`
that combines the info and post analytics previously found under
`/info/instagram` and `/posts/instagram`. By default only the latest 12
Instagram posts are fetched from the backend.


## TikTok Post Analysis API

The TikTok Post Analysis page works similarly to the Instagram one but uses the TikTok endpoints `getTiktokProfileViaBackend` and `getTiktokPostsViaBackend` found in `cicero-dashboard/utils/api.js`.

The dashboard provides a single TikTok Post Analysis page at `/tiktok`
that merges the info and post analytics into one view. By default,
the visualized posts are limited to the current month.

### Profile Fields
- `username`
- `followers`
- `following`
- `bio`

### Post Fields
- `id`
- `created_at`
- `type`
- `caption`
- `like_count`
- `comment_count`
- `share_count`
- `view_count` (optional)
- `thumbnail` (optional)

These values are provided by `/api/tiktok/rapid-profile` and `/api/tiktok/rapid-posts`.

## Running Tests

Jest unit tests live in `cicero-dashboard/__tests__`. Execute them from inside
the dashboard directory:

```bash
cd cicero-dashboard
npm test
```

The test suite uses the `jest` command specified in `package.json`.
