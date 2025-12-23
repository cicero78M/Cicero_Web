# Amplifikasi Link Insight

Dokumen ini merangkum standar UI/UX dan alur kerja halaman **Amplifikasi Link Insight** (`/amplify`) beserta tab rekap (`/amplify/rekap`).

## Standar tampilan

- Menggunakan `InsightLayout` agar header, tab, dan latar visual konsisten dengan halaman Instagram Engagement Insight.
- Menggunakan `EngagementInsightMobileScaffold` untuk kontrol periode, tombol salin rekap, kartu ringkasan, serta panel quick insight.
- Rekap detail disajikan di dalam `DetailRekapSection` agar pengguna dapat beralih tab tanpa meninggalkan halaman.

## Alur kerja data

- Periode diambil dari `useLikesDateSelector` dan diteruskan ke `getRekapAmplify` melalui `getPeriodeDateForView`.
- Pengambilan data di `AmplifyInsightView` memakai `AbortController` agar request dibatalkan saat komponen unmount atau periode berubah, sehingga tidak ada `setState` setelah unmount.
- Jika tipe klien adalah direktorat, data diperkaya dengan nama client melalui `getClientNames`.
- Ringkasan (total user, sudah/belum post, total link) dihitung di `AmplifyInsightView` sebelum ditampilkan.

## Rekap cepat

- Tombol **Salin Rekap** menggunakan utilitas `buildAmplifyRekap` untuk menghasilkan teks ringkas yang bisa ditempel ke WhatsApp atau laporan harian.

## Lokasi modul terkait

- `cicero-dashboard/app/amplify/AmplifyInsightView.jsx`
- `cicero-dashboard/utils/amplifyRekap.ts`
- `cicero-dashboard/components/RekapAmplifikasi.jsx`
