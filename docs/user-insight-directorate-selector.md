# User Insight – Mekanisme Selector Client Satker untuk Client DIREKTORAT Asli

Dokumen ini menjelaskan update pada `cicero-dashboard/app/user-insight/page.jsx` untuk menyamakan perilaku selector satker dengan halaman insight engagement lain.

## Ringkasan perubahan

1. Menambahkan state `directorateScope` dengan nilai awal `"client"`.
2. Untuk **client type DIREKTORAT asli** (`effectiveClientType === "DIREKTORAT"`), scope di-set otomatis ke `"all"` pada initial render.
3. Menambahkan kontrol **Lingkup** (`client` / `all`) pada UI user insight untuk client DIREKTORAT asli.
4. Menampilkan `DirectorateClientSelector` hanya ketika:
   - mode direktorat aktif, dan
   - client adalah DIREKTORAT asli, dan
   - scope berada di `all`, dan
   - daftar client tersedia.
5. Menjaga sinkronisasi `selectedClientId` agar reset ketika opsi client berubah/tidak valid.
6. Saat scope `client`, data dipersempit ke client login aktif; saat scope `all`, data menampilkan satker jajaran dan dapat difilter via selector satker.

## Dampak perilaku

- User DIREKTORAT asli kini langsung melihat cakupan `Satker Jajaran` pada load pertama.
- User tetap dapat mengubah lingkup ke `Client Aktif` untuk fokus data internal.
- Selector satker tidak tampil jika data client kosong atau scope bukan `all`.

## Titik implementasi

- `cicero-dashboard/app/user-insight/page.jsx`
  - State baru: `directorateScope`
  - Flag baru: `isOriginalDirectorateClient`
  - Effect auto default scope ke `all`
  - Penyesuaian `filteredUsers` berbasis scope
  - Filter data di `fetchData` saat scope `client`
  - UI kontrol Lingkup + `DirectorateClientSelector` kondisional
