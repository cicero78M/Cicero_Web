# TikTok Engagement Insight

Halaman **/comments/tiktok** kini menggabungkan wawasan grafik dan rekap komentar ke dalam satu tampilan dengan pola yang sama seperti **/likes/instagram**: tab dan header ditangani oleh `InsightLayout` sehingga tampilan tidak lagi memakai layout khusus. Pengguna dapat memilih periode data (harian, bulanan, atau rentang kustom) sekaligus melihat tabel detail personel tanpa berpindah halaman.

## Pola tab dan CTA konsisten
- Header memakai tab **Dashboard Insight** dan **Rekap Detail** via `DEFAULT_INSIGHT_TABS` pada `InsightLayout` dengan `activeTab` dan `handleTabChange`, menyamakan pola dengan halaman Instagram.
- Tombol **Buka Rekap Detail** otomatis menggulir ke section rekap ketika tab rekap dipilih, menjaga konteks halaman.
- Tombol **Salin Rekap** dipindahkan ke header bersama filter agar saluran tindakan utama konsisten dengan halaman Instagram Engagement Insight.
- Header, filter tanggal, dan kontrol lingkup kini dibungkus `heroContent` yang diberikan ke `InsightLayout` sehingga struktur halaman TikTok dan Instagram identik dan tidak lagi memakai layout khusus untuk TikTok.

## Ringkasan tanpa duplikasi kartu
- Deretan kartu ringkasan disusun lewat daftar unik agar tidak ada label yang tampil ganda ketika data berganti.
- Kartu **Total User** ditambahkan berdampingan dengan jumlah posting agar informasi baseline pengguna konsisten dengan tampilan di halaman Instagram Engagement Insight.
- Status negatif disatukan dalam kartu **Perlu Aksi** sehingga fokus langsung pada akun yang belum memenuhi target komentar.
- Tiga kartu insight singkat di bawah ringkasan memberi konteks cerdas tentang kepatuhan, prioritas perbaikan, dan kebersihan data username.

## Pengaturan periode
- Komponen `ViewDataSelector` dipakai untuk memilih periode dan tanggal terkait dan kini dikelola oleh hook bersama `useLikesDateSelector` agar logika pemilihan tanggal tetap konsisten dengan halaman Instagram.
- `useLikesDateSelector` mempertahankan perilaku lama: untuk mode `custom_range`, tanggal awal dan akhir akan otomatis ditukar jika pengguna memilih rentang terbalik.
- Mode `month` menggunakan format `YYYY-MM` agar konsisten dengan API.

## Ruang lingkup Ditbinmas
Pengguna dengan peran Ditbinmas mendapat opsi **Lingkup Data**:
- `client` menampilkan rekap hanya untuk client aktif pengguna (default).
- `all` menampilkan gabungan seluruh client Ditbinmas. Opsi ini diteruskan ke `useTiktokCommentsData` melalui parameter `scope`.
- Kontrol lingkup kini hanya muncul untuk pengguna direktorat non-ORG dengan `client_id` **DITBINMAS**, **DITSAMAPTA**, **DITLANTAS**, atau **BIDHUMAS** agar satker lain tidak melihat filter yang tidak relevan.

## Perubahan hook
`useTiktokCommentsData` sekarang menerima parameter opsional `scope` (`"client" | "all"`). Nilai `"all"` menonaktifkan filter client sehingga data rekap dapat meliputi seluruh satker Ditbinmas. Hook ini juga mengembalikan `isOrgClient` yang diambil dari `effectiveClientType` ter-normalisasi agar komponen pemanggil dapat menyembunyikan kontrol lingkup ketika pengguna berasal dari klien bertipe ORG. Penggunaan `DEFAULT_INSIGHT_TABS` tidak mengubah kontrol lingkup atau alur salin rekap; keduanya tetap dijaga untuk keselarasan lintas halaman.

## Kompatibilitas rute lama
Rute lama `/comments/tiktok/rekap` kini mengalihkan ke halaman utama `/comments/tiktok` untuk menjaga tautan eksisting tanpa menggandakan UI.

## Rekap Post TikTok

Halaman `/posts/tiktok` mengikuti pola tab insight/rekap yang sama dengan Instagram dan komentar TikTok:

- Header filter menambahkan dropdown **Lingkup** bagi Ditbinmas/direktorat yang memenuhi syarat, memfilter tampilan antara klien aktif (`client`) atau seluruh satker jajaran (`all`). Tombol **Salin Rekap** berdampingan agar pesan WhatsApp otomatis mengikuti cakupan yang dipilih.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L26-L138】【F:cicero-dashboard/app/posts/tiktok/page.jsx†L250-L329】
- Utilitas `buildTiktokPostRekap` membangkitkan ringkasan performa (post per hari, rata-rata views/likes/komentar/share, engagement rate, rasio follower/following, top 3 post) dan disalin via clipboard bila tersedia.【F:cicero-dashboard/utils/tiktokPostRekap.ts†L1-L76】
- Tab rekap menampilkan komponen `RekapTiktokPosts` dengan narasi kontekstual dan tabel metrik per post (pencarian + pagination), sehingga operator dapat menjelajahi konten tanpa meninggalkan dashboard insight.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L360-L470】【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L1-L170】
