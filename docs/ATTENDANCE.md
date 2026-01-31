# Absensi Likes Instagram & Knowledge Base Cicero

Dokumen ini merangkum cara dashboard mengelola absensi likes Instagram serta bagaimana halaman knowledge base mendukung operator di lapangan.

## Alur Pengambilan Data

1. Halaman **Instagram Engagement Insight** menjalankan hook `useInstagramLikesData` untuk mengambil data berdasarkan mode tampilan yang dipilih (today, yesterday, weekly, monthly, custom range). Hook ini memanfaatkan `useAuth` untuk memperoleh token, `client_id`, role, serta nilai override `effectiveRole`/`effectiveClientType` (dengan fallback `localStorage`) sebelum memutuskan cakupan data. Seluruh data chart, kartu ringkasan, dan tabel rekap sekarang **100% bersumber dari `/api/insta/rekap-likes`** tanpa pemanggilan endpoint lain untuk melengkapi metadata.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L79-L472】
2. Untuk rentang tanggal, hook memanggil `getPeriodeDateForView` sehingga parameter periode, tanggal tunggal, atau rentang tanggal selalu konsisten dengan format backend.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L80-L96】
3. Untuk seluruh role termasuk **Ditbinmas** dan kombinasi **DITSAMAPTA** + **BIDHUMAS**, hook hanya memanggil `/api/insta/rekap-likes`. Metadata direktori (daftar `clients`/`directory`), ringkasan total, daftar user, dan daftar posting diambil dari payload rekap yang sama tanpa lookup tambahan, sehingga semua mode (client/all) tetap konsisten di satu sumber data.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L77-L566】
4. Data chart/tabel di sisi UI langsung bersumber dari payload rekap: jika backend menyertakan `chartData`, hook akan memakainya apa adanya; jika tidak, daftar user diambil dari `rekapRes.data` (atau `rekapRes.users`). Field lain seperti `insights` tidak dipakai untuk rekap likes agar jalur data tetap konsisten di satu sumber.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L260-L520】
5. Penentuan layout direktorat dan opsi `scope` (client/all) sekarang hanya berdasarkan `effectiveRole`/`effectiveClientType` serta metadata `scope` yang tersedia di payload rekap. Jika metadata client/divisi tidak tersedia di payload rekap, UI menampilkan label fallback seperti **Client <id>** atau **Client tidak diketahui** alih-alih memanggil endpoint tambahan.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L353-L608】【F:cicero-dashboard/app/likes/instagram/InstagramEngagementInsightView.jsx†L89-L265】
6. Untuk role **operator**, hook tetap menggunakan `client_id` login saat meminta rekap. Penyaringan user operator hanya dilakukan ketika payload rekap sudah membawa atribut role; jika tidak tersedia maka seluruh daftar rekap ditampilkan apa adanya demi menjaga sumber data tetap tunggal dari `/api/insta/rekap-likes`.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L428-L602】
7. Fungsi `getRekapLikesIG` kini menggunakan helper `resolveRoleScopeRegionalOptions` yang menggabungkan `AbortSignal` dan opsi `role`/`scope`/`regional_id` (termasuk bila sinyal disematkan di objek opsi). Dengan begitu setiap pemanggilan `/api/insta/rekap-likes` otomatis menambahkan parameter `scope` dan `regional_id` di query string ketika tersedia, meskipun pemanggil hanya menyuplai `signal` atau opsi terpisah, sehingga mekanisme filter regional tetap konsisten di seluruh jalur hook dan utilitas absensi.【F:cicero-dashboard/utils/api.ts†L1177-L1217】

### Field wajib dari endpoint `/api/insta/rekap-likes`

Payload rekap likes wajib memuat data personel dengan field berikut agar tabel rekap dan ringkasan berjalan konsisten:

- `username` (username IG utama; jika backend mengirimkan alias seperti `ig_username`, UI akan melakukan fallback sebelum data dipakai).
- `nama` (nama personel).
- `divisi` (satker/divisi atau label unit).
- `jumlah_like` (jumlah like yang sudah dilakukan).
- `client_id` (kode client/satker untuk grouping dan filter).

Field ini dipakai langsung pada hook `useInstagramLikesData`, utilitas `fetchDitbinmasAbsensiLikes`, dan komponen `RekapLikesIG` untuk kalkulasi status dan penampilan tabel rekap.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L15-L545】【F:cicero-dashboard/utils/absensiLikes.ts†L1-L198】【F:cicero-dashboard/components/likes/instagram/Rekap/RekapLikesIG.jsx†L1-L360】

## Perhitungan Ringkasan Absensi

- Baik pada mode Ditbinmas maupun klien biasa, ringkasan **Sudah Like**, **Kurang Like**, **Belum Like**, serta **Tanpa Username** sekarang langsung memakai field rekap backend: `summary.*`, `usersCount`, `sudahUsersCount`, `kurangUsersCount`, `belumUsersCount`, `noUsernameUsersCount`, serta `totalPosts` (atau alias setara) dari payload `/api/insta/rekap-likes` tanpa menghitung ulang status di frontend. Total posting tetap diambil dari payload rekap (misalnya `summary.totalPosts`/`totalPosts`) agar kartu ringkasan selalu sinkron dengan perhitungan backend.【F:cicero-dashboard/hooks/useInstagramLikesData.ts†L300-L520】
- Ringkasan tersebut ditampilkan di komponen `SummaryItem` bersama persentase yang dihitung dari total user valid (total user dikurangi akun tanpa username). Komponen berada di namespace gabungan `components/likes/instagram/Insight` agar berbagi gaya dengan chart utama.【F:cicero-dashboard/app/likes/instagram/page.jsx†L41-L120】【F:cicero-dashboard/components/likes/instagram/Insight/SummaryItem.jsx†L1-L160】
- Kartu ringkasan di halaman Instagram Engagement Insight kini memakai templat standar (label, nilai, warna palet, ikon) yang sama dengan TikTok Engagement Insight: enam metrik tetap (jumlah IG post, total user, sudah/kurang/belum like, dan tanpa username) menggunakan komponen `SummaryItem` bawaan agar operator melihat pola seragam lintas platform.【F:cicero-dashboard/app/likes/instagram/InstagramEngagementInsightView.jsx†L261-L308】【F:cicero-dashboard/app/comments/tiktok/TiktokEngagementInsightView.jsx†L74-L155】

## Standarisasi Rekap Personel

- Segment **Rekap Personel Instagram** menyamakan desain dengan halaman TikTok: status baris memakai `clampEngagementCompleted` agar jumlah like tidak melampaui target posting, pencarian ikut membersihkan label satfung/polsek serta `client_id`, dan tabel zebra menampilkan badge status, detail client + ID, serta footer pagination Prev/Reset/Next yang menyatu dengan tabel seperti standar TikTok Engagement Insight.【F:cicero-dashboard/components/likes/instagram/Rekap/RekapLikesIG.jsx†L1-L360】

## Pengelompokan dan Visualisasi

- Hook mengembalikan flag `isDirectorateData`, `isDirectorateLayout`, `isOrgClient`, `isDirectorateScopedClient`, serta `clientName`. Informasi ini menentukan apakah chart akan digrup berdasarkan divisi, kelompok (menggunakan `groupUsersByKelompok` dari `utils/instagramEngagement.ts`), atau langsung per Polres saat memvisualisasikan data. Pada mode direktorat, pemilihan grouping (client vs divisi), judul, dan orientasi chart mengikuti metadata yang tersedia di payload `/api/insta/rekap-likes` sehingga UI DIREKTORAT sepenuhnya mengandalkan rekap tersebut.【F:cicero-dashboard/app/likes/instagram/InstagramEngagementInsightView.jsx†L100-L416】【F:cicero-dashboard/app/likes/instagram/page.jsx†L21-L160】【F:cicero-dashboard/utils/instagramEngagement.ts†L1-L69】
- Untuk menjaga label tetap sesuai rekap, chart direktorat Instagram kini menonaktifkan lookup `getClientNames` dan memakai `client_id`/`client_name`/`nama_client` dari payload rekap sebagai label. Jika nama tidak tersedia, label fallback akan menggunakan **Client <id>** atau **Client tidak diketahui** sehingga narasi dan judul chart tetap masuk akal meski metadata minim.【F:cicero-dashboard/app/likes/instagram/InstagramEngagementInsightView.jsx†L100-L416】【F:cicero-dashboard/components/ChartDivisiAbsensi.jsx†L22-L123】
- Data yang sudah difilter dikirim ke komponen `ChartBox` dan `ChartHorizontal` untuk menampilkan ranking likes dan tabel pendukung, sehingga operator mendapatkan gambaran kinerja secara cepat.【F:cicero-dashboard/app/likes/instagram/page.jsx†L85-L200】

## Rekap Otomatis via WA

- Tombol **Copy Rekap** tersedia di header filter tab insight/rekap dan memanggil utilitas `buildInstagramRekap` pada modul `utils/instagramEngagement.ts`. Fungsi ini membangkitkan pesan sapaan otomatis berisi ringkasan global serta daftar per klien dengan ikon ✅/⚠️/❌/⁉️, menyesuaikan cakupan Ditbinmas (client/all) sebelum menempel ke clipboard untuk WAG.【F:cicero-dashboard/app/likes/instagram/page.jsx†L85-L160】【F:cicero-dashboard/utils/instagramEngagement.ts†L71-L120】

## Knowledge Base Pendukung

- **Mekanisme Sistem Absensi** (`/mekanisme-absensi`) menyediakan blueprint aktor (Ditbinmas, Operator, Personil, Sistem), alur kerja empat langkah, matriks RACI, dan istilah integrasi seperti Re-fetch, Shadowban, Auto Recap, serta Attendance Score. Konten ini membantu pemangku kepentingan memahami konteks di balik angka absensi.【F:cicero-dashboard/app/mekanisme-absensi/page.jsx†L1-L320】
- **Panduan & SOP** (`/panduan-sop`) memuat panduan registrasi dan update data via WA bot, langkah harian operator, FAQ shadowban, SOP likes & komentar, hingga SOP operator Polres. Halaman ini juga mengumumkan nomor WA bot terbaru yang wajib digunakan seluruh anggota.【F:cicero-dashboard/app/panduan-sop/page.jsx†L1-L320】

Gunakan kedua halaman knowledge base sebagai referensi resmi saat melakukan onboarding, audit SOP, atau menjawab pertanyaan lapangan yang berulang.
