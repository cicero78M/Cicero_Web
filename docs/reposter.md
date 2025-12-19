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
- Navigasi ke modul reposter tersedia di sidebar dashboard (`/reposter`).
- Link “Buka reposter di tab baru” membantu pengguna membuka aplikasi reposter
  secara langsung jika membutuhkan layar penuh.
