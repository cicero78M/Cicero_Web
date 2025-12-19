# Reposter (Micro-frontend)

## Ringkasan

Dashboard Cicero menampilkan aplikasi reposter sebagai layanan terpisah melalui
iframe pada rute `/reposter`. Strategi ini menjaga aplikasi utama tetap ringan
sambil memungkinkan pengembangan reposter berjalan mandiri.

## Konfigurasi

Tambahkan variabel lingkungan berikut di `.env.local` agar iframe mengarah ke URL
layanan reposter yang aktif:

```bash
NEXT_PUBLIC_REPOSTER_URL=https://reposter.example.com
```

Jika nilai tidak diisi, dashboard menggunakan fallback default
`http://localhost:5173` untuk kebutuhan pengembangan lokal.

Login reposter juga memanfaatkan API dashboard sehingga memerlukan
`NEXT_PUBLIC_API_URL` yang mengarah ke backend Cicero. Tidak ada variabel
lingkungan tambahan khusus reposter selain dua nilai di atas.

## Menjalankan & Deploy Reposter

1. Jalankan layanan reposter sebagai aplikasi terpisah (micro-frontend). URL
   publiknya harus dapat diakses dari dashboard.
2. Setel `NEXT_PUBLIC_REPOSTER_URL` pada environment dashboard sesuai host
   reposter (staging/production).
3. Pastikan backend Cicero tersedia dan `NEXT_PUBLIC_API_URL` di dashboard
   menunjuk ke base URL yang benar karena login reposter memanggil
   `/api/auth/reposter-login`.

Dengan konfigurasi tersebut, halaman `/reposter` akan menampilkan aplikasi
reposter melalui iframe dan link “Buka reposter di tab baru” akan membuka URL
yang sama.

## Implementasi

- Entry point Next.js berada di `cicero-dashboard/app/reposter/page.tsx`.
- Autentikasi reposter memakai halaman login khusus di
  `cicero-dashboard/app/reposter/login/page.tsx` dengan context terpisah dan
  membungkus form client dalam Suspense karena menggunakan `useSearchParams`.
  `ReposterAuthContext` agar token tidak bercampur dengan login dashboard utama.
- Token reposter disimpan di localStorage dengan kunci `reposter_token` dan
  cookie `reposter_session` agar middleware dapat melakukan redirect lebih awal
  sebelum halaman dirender.
- Navigasi ke modul reposter tersedia di sidebar dashboard (`/reposter`).
- Link “Buka reposter di tab baru” membantu pengguna membuka aplikasi reposter
  secara langsung jika membutuhkan layar penuh.
- Halaman `/reposter/login` dirender tanpa header dan sidebar dashboard agar
  pengalaman login reposter terasa terpisah dari modul utama.

## Alur Login Reposter

1. Pengguna mengakses `/reposter/login` langsung, atau memilihnya dari halaman agregator login update di `/login-update`.
2. Dashboard mengirim POST ke `/api/auth/reposter-login` di backend Cicero.
3. Jika berhasil, token disimpan ke localStorage (`reposter_token`) dan cookie
   `reposter_session` dengan scope path `/reposter`.
4. Pengguna diarahkan kembali ke path tujuan (default `/reposter`).

## Perbedaan Autentikasi Reposter vs Dashboard Utama

- Reposter memakai context terpisah (`ReposterAuthContext`) dan storage key
  `reposter_token`, sehingga tidak berbagi sesi dengan login dashboard utama
  (yang menggunakan token/flow berbeda).
- Cookie reposter hanya berlaku untuk path `/reposter`, sehingga middleware
  dapat melakukan redirect lebih awal tanpa mengganggu rute dashboard lainnya.

## Rute & Proteksi Akses

- `/reposter` menampilkan iframe reposter dan dilindungi oleh hook
  `useRequireReposterAuth` di sisi client. Jika token belum ada, pengguna
  diarahkan ke `/reposter/login`.
- `/reposter/login` adalah halaman login khusus reposter, tidak diblok oleh
  middleware.
- Middleware di `cicero-dashboard/middleware.ts` memeriksa cookie
  `reposter_session` untuk semua path `/reposter/*` selain `/reposter/login`
  dan mengarahkan ke login bila cookie belum tersedia.
