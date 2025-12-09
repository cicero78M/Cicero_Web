# Absensi Likes Instagram & Knowledge Base Cicero

Dokumen ini merangkum cara dashboard mengelola absensi likes Instagram serta bagaimana halaman knowledge base mendukung operator di lapangan.

## Alur Pengambilan Data

1. Halaman **Instagram Engagement Insight** menjalankan hook `useInstagramLikesData` untuk mengambil data berdasarkan mode tampilan yang dipilih (today, yesterday, weekly, monthly, custom range). Hook ini memanfaatkan `useAuth` untuk memperoleh token, `client_id`, role, serta nilai override `effectiveRole`/`effectiveClientType` (dengan fallback `localStorage`) sebelum memutuskan cakupan data.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L18-L87】
2. Untuk rentang tanggal, hook memanggil `getPeriodeDateForView` sehingga parameter periode, tanggal tunggal, atau rentang tanggal selalu konsisten dengan format backend.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L80-L96】
3. Saat role pengguna adalah **Ditbinmas**, hook men-delegasikan proses ke `fetchDitbinmasAbsensiLikes`. Utilitas ini menggabungkan statistik dashboard, direktori user, dan rekap likes dari seluruh Polres yang memiliki role `ditbinmas`, lalu menormalisasi nama klien melalui `getClientNames`. Hasil akhirnya berupa daftar user terpadu, rekap ringkas, daftar posting, dan nama klien agregat.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L42-L113】【F:cicero-dashboard/utils/absensiLikes.ts†L1-L120】
4. Untuk role selain Ditbinmas, hook mengambil profil klien guna menentukan apakah akun termasuk direktorat. Status ini kini hanya bernilai true jika `effectiveClientType` berisi `DIREKTORAT`; override DITSAMAPTA–BIDHUMAS (`effectiveClientType: ORG`) memastikan jalur direktorat dilewati sehingga rekap memakai `client_id` login seperti klien ORG lain. Jika bukan direktorat, data dibatasi pada `client_id` login agar operator hanya melihat satkernya sendiri.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L97-L214】

## Perhitungan Ringkasan Absensi

- Baik pada mode Ditbinmas maupun klien biasa, sistem menghitung ulang jumlah **Sudah Like**, **Kurang Like**, **Belum Like**, serta **Tanpa Username** dengan membandingkan `jumlah_like` terhadap total posting yang dirilis pada hari tersebut. Apabila belum ada posting, seluruh user dianggap belum melakukan likes agar status tetap mudah dipantau.【F:cicero-dashboard/utils/absensiLikes.ts†L121-L188】【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L188-L212】
- Ringkasan tersebut ditampilkan di komponen `SummaryItem` bersama persentase yang dihitung dari total user valid (total user dikurangi akun tanpa username).【F:cicero-dashboard/app/likes/instagram/page.jsx†L41-L120】

## Pengelompokan dan Visualisasi

- Hook mengembalikan flag `isDirectorate`, `isDitbinmasScopedClient`, dan `clientName`. Informasi ini menentukan apakah chart akan digrup berdasarkan divisi, kelompok (menggunakan `groupUsersByKelompok`), atau langsung per Polres saat memvisualisasikan data.【F:cicero-dashboard/app/likes/instagram/page.jsx†L21-L84】
- Data yang sudah difilter dikirim ke komponen `ChartBox` dan `ChartHorizontal` untuk menampilkan ranking likes dan tabel pendukung, sehingga operator mendapatkan gambaran kinerja secara cepat.【F:cicero-dashboard/app/likes/instagram/page.jsx†L85-L200】

## Rekap Otomatis via WA

- Tombol **Copy Rekap** memanggil utilitas `buildInstagramRekap`. Fungsi ini membangkitkan pesan sapaan otomatis berisi ringkasan global serta daftar per klien dengan ikon ✅/⚠️/❌/⁉️. Pesan langsung ditempel ke clipboard sehingga siap dikirim ke WAG Ditbinmas.【F:cicero-dashboard/app/likes/instagram/page.jsx†L121-L200】【F:cicero-dashboard/utils/buildInstagramRekap.ts†L1-L56】

## Knowledge Base Pendukung

- **Mekanisme Sistem Absensi** (`/mekanisme-absensi`) menyediakan blueprint aktor (Ditbinmas, Operator, Personil, Sistem), alur kerja empat langkah, matriks RACI, dan istilah integrasi seperti Re-fetch, Shadowban, Auto Recap, serta Attendance Score. Konten ini membantu pemangku kepentingan memahami konteks di balik angka absensi.【F:cicero-dashboard/app/mekanisme-absensi/page.jsx†L1-L320】
- **Panduan & SOP** (`/panduan-sop`) memuat panduan registrasi dan update data via WA bot, langkah harian operator, FAQ shadowban, SOP likes & komentar, hingga SOP operator Polres. Halaman ini juga mengumumkan nomor WA bot terbaru yang wajib digunakan seluruh anggota.【F:cicero-dashboard/app/panduan-sop/page.jsx†L1-L320】

Gunakan kedua halaman knowledge base sebagai referensi resmi saat melakukan onboarding, audit SOP, atau menjawab pertanyaan lapangan yang berulang.
