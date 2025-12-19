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

## Implementasi

- Entry point Next.js berada di `cicero-dashboard/app/reposter/page.tsx`.
- Autentikasi reposter memakai halaman login khusus di
  `cicero-dashboard/app/reposter/login/page.tsx` dengan context terpisah
  `ReposterAuthContext` agar token tidak bercampur dengan login dashboard utama.
- Token reposter disimpan di localStorage dengan kunci `reposter_token` dan
  cookie `reposter_session` agar middleware dapat melakukan redirect lebih awal
  sebelum halaman dirender.
- Navigasi ke modul reposter tersedia di sidebar dashboard (`/reposter`).
- Link “Buka reposter di tab baru” membantu pengguna membuka aplikasi reposter
  secara langsung jika membutuhkan layar penuh.

## Proteksi Akses

- Hook `useRequireReposterAuth` melindungi halaman `/reposter` di sisi client
  dengan me-redirect ke `/reposter/login` jika token belum tersedia.
- Middleware Next.js di `cicero-dashboard/middleware.ts` mengecek cookie
  `reposter_session` untuk semua path `/reposter` kecuali `/reposter/login`,
  sehingga pengguna yang belum login langsung diarahkan ke form login.
