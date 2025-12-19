# Reposter (Dashboard Module)

## Ringkasan

Dashboard Cicero menyediakan modul reposter secara native melalui rute
`/reposter`. Halaman ini menampilkan menu utama menuju profil pengguna, tugas
official, dan tugas khusus agar pengelolaan konten ulang tetap terpusat di
dashboard.

## Konfigurasi

Login reposter memanfaatkan API dashboard sehingga memerlukan
`NEXT_PUBLIC_API_URL` yang mengarah ke backend Cicero.

## Menjalankan & Deploy Reposter

1. Pastikan backend Cicero tersedia dan `NEXT_PUBLIC_API_URL` di dashboard
   menunjuk ke base URL yang benar karena login reposter memanggil
   `/api/auth/user-login` dengan payload `nrp` dan `password`.
2. Jalankan dashboard seperti biasa (Next.js). Modul reposter akan tersedia di
   `/reposter` dan dilindungi oleh autentikasi reposter.

## Implementasi

- Entry point Next.js berada di `cicero-dashboard/app/reposter/page.tsx`.
- Autentikasi reposter memakai halaman login khusus di
  `cicero-dashboard/app/reposter/login/page.tsx` dengan context terpisah dan
  membungkus form client dalam Suspense karena menggunakan `useSearchParams`.
  `ReposterAuthContext` agar token tidak bercampur dengan login dashboard utama.
- Token reposter disimpan di localStorage dengan kunci `reposter_token`,
  ringkasan profil disimpan sebagai `reposter_profile`, dan cookie
  `reposter_session` dipakai agar middleware dapat melakukan redirect lebih awal
  sebelum halaman dirender.
- Halaman `/reposter/login` dirender tanpa header dan sidebar dashboard agar
  pengalaman login reposter terasa terpisah dari modul utama.
- Dashboard menambahkan rute `/reposter/profile`, `/reposter/tasks/official`, dan
  `/reposter/tasks/special` yang menampilkan data profil dan daftar tugas secara
  native di dashboard.
- Halaman `/reposter/profile` kini mengambil detail user dari tabel `user`
  melalui endpoint Cicero_V2 `GET /api/users/{nrp}` dan menyediakan form edit
  untuk Nama, Pangkat, Satfung, Jabatan, username Instagram, username TikTok,
  serta email. Pembaruan disimpan lewat `PUT /api/users/{nrp}`.

## Alur Login Reposter

1. Pengguna mengakses `/reposter/login` langsung, atau memilihnya dari halaman agregator login update di `/login-update`.
2. Dashboard mengirim POST ke `/api/auth/user-login` di backend Cicero dengan
   payload `nrp` dan `password`.
3. Jika berhasil, token disimpan ke localStorage (`reposter_token`), ringkasan
   profil ke `reposter_profile`, dan cookie `reposter_session` dengan scope path
   `/reposter`.
4. Pengguna diarahkan kembali ke path tujuan (default `/reposter`).

## Perbedaan Autentikasi Reposter vs Dashboard Utama

- Reposter memakai context terpisah (`ReposterAuthContext`) dan storage key
  `reposter_token`, sehingga tidak berbagi sesi dengan login dashboard utama
  (yang menggunakan token/flow berbeda). Ringkasan profil disimpan di
  `reposter_profile` untuk memastikan halaman profil selalu sesuai sesi login.
- Cookie reposter hanya berlaku untuk path `/reposter`, sehingga middleware
  dapat melakukan redirect lebih awal tanpa mengganggu rute dashboard lainnya.

## Rute & Proteksi Akses

- `/reposter` menampilkan menu modul reposter dan dilindungi oleh hook
  `useRequireReposterAuth` di sisi client. Jika token belum ada, pengguna
  diarahkan ke `/reposter/login`.
- `/reposter/profile` menampilkan halaman profil pengguna berbasis data login
  reposter (selaras dengan profil pada pegiat_medsos_app), mengambil data detail
  dari tabel user (endpoint Cicero_V2) dan menyediakan tombol simpan data.
- `/reposter/tasks/official` menampilkan daftar tugas official yang diambil dari
  endpoint backend.
- `/reposter/tasks/special` menampilkan daftar tugas khusus yang diambil dari
  endpoint backend.
- `/reposter/login` adalah halaman login khusus reposter, tidak diblok oleh
  middleware.
- Middleware di `cicero-dashboard/middleware.ts` memeriksa cookie
  `reposter_session` untuk semua path `/reposter/*` selain `/reposter/login`
  dan mengarahkan ke login bila cookie belum tersedia.

## Integrasi Endpoint Tugas

Halaman tugas reposter memakai endpoint backend yang sama dengan dashboard
untuk memuat data tugas. Helper `getOfficialTasks` dan `getSpecialTasks` di
`cicero-dashboard/utils/api.ts` menerima token reposter (`reposter_token`)
dan meneruskannya melalui header Authorization. Detail parameter filter dan
skema response dijelaskan di `docs/tasks_api.md`.
