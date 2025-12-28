# Amplifikasi Link Insight

Dokumen ini merangkum standar UI/UX dan alur kerja halaman **Amplifikasi Link Insight** (`/amplify`) beserta tab rekap (`/amplify/rekap`).

## Standar tampilan

- Menggunakan `InsightLayout` agar header, tab, dan latar visual konsisten dengan halaman Instagram Engagement Insight.
- Menggunakan `EngagementInsightMobileScaffold` untuk kontrol periode, tombol salin rekap, kartu ringkasan, serta panel quick insight.
- Properti `premiumCta` pada `EngagementInsightMobileScaffold` menampilkan tombol ajakan Premium penuh lebar di header kontrol (baik mobile maupun desktop) agar ruang kosong terisi rapi dan CTA tetap mencolok.
- Rekap detail disajikan di dalam `DetailRekapSection` agar pengguna dapat beralih tab tanpa meninggalkan halaman.

## Alur kerja data

- Periode diambil dari `useLikesDateSelector` dan diteruskan ke `getRekapAmplify` melalui `getPeriodeDateForView`.
- Pengambilan data di `AmplifyInsightView` memakai `AbortController` agar request dibatalkan saat komponen unmount atau periode berubah, sehingga tidak ada `setState` setelah unmount.
- Jika tipe klien adalah direktorat, data diperkaya dengan nama client melalui `getClientNames`.
- Ringkasan (total user, sudah/belum post, total link) dihitung di `AmplifyInsightView` sebelum ditampilkan.

## Rekap cepat

- Tombol **Salin Rekap** menggunakan utilitas `buildAmplifyRekap` untuk menghasilkan teks ringkas yang bisa ditempel ke WhatsApp atau laporan harian.

## API params `/api/amplify/rekap`

Parameter query yang dipakai frontend (sesuai backend):

- `client_id`: ID klien yang dipilih pada halaman.
- `periode`: nilai periode rekap (contoh: `harian`, `mingguan`, `bulanan`).
- `tanggal`: tanggal spesifik untuk mode harian.
- `tanggal_mulai`: tanggal awal untuk rentang periode.
- `tanggal_selesai`: tanggal akhir untuk rentang periode.
- `role`: role login (dipakai backend untuk filtering akses).
- `scope`: scope akses (mis. `DIREKTORAT` atau `ORG`).
- `regional_id`: filter regional bila tersedia.

Contoh query (mode harian):

```
/api/amplify/rekap?client_id=123&periode=harian&tanggal=2024-06-12&role=KAPOLDA&scope=DIREKTORAT
```

Contoh query (mode rentang tanggal + regional):

```
/api/amplify/rekap?client_id=123&periode=rentang&tanggal_mulai=2024-06-01&tanggal_selesai=2024-06-12&role=KAPOLDA&scope=ORG&regional_id=11
```

## Alignment workflow dengan `/api/insta/rekap-likes`

- Struktur parameter tanggal mengikuti pola yang sama dengan `/api/insta/rekap-likes`: `periode`, `tanggal` (harian), serta pasangan `tanggal_mulai`/`tanggal_selesai` (rentang). Rekap likes juga menerima `role`, `scope`, dan `regional_id` untuk penyaringan berdasarkan konteks login.
- `role` dan `scope` diteruskan dari sesi login agar backend menerapkan aturan scope yang konsisten di kedua endpoint.
- `client_id` tetap menjadi sumber identitas utama; jika user berada pada scope direktorat, backend dapat meluaskan rekap ke seluruh klien di bawah direktorat tersebut, sedangkan scope ORG membatasi rekap ke organisasi/klien yang bersangkutan.

Contoh query (selaras dengan rekap likes):

```
/api/insta/rekap-likes?client_id=123&periode=harian&tanggal=2024-06-12&role=KAPOLDA&scope=DIREKTORAT&regional_id=11
```

## Lokasi modul terkait

- `cicero-dashboard/app/amplify/AmplifyInsightView.jsx`
- `cicero-dashboard/utils/amplifyRekap.ts`
- `cicero-dashboard/components/RekapAmplifikasi.jsx`
