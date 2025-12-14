# TikTok Engagement Insight

Halaman **/comments/tiktok** kini menggabungkan wawasan grafik dan rekap komentar ke dalam satu tampilan dengan pola yang sama seperti **/likes/instagram**: tab dan header ditangani oleh `InsightLayout` sehingga tampilan tidak lagi memakai layout khusus. Pengguna dapat memilih periode data (harian, bulanan, atau rentang kustom) sekaligus melihat tabel detail personel tanpa berpindah halaman.

## Rekap detail selaras dengan Instagram
- Section **Rekapitulasi Engagement TikTok** memakai kerangka UI yang sama dengan segment rekap Instagram (pola kartu putih dengan border biru, judul tebal, dan deskripsi biru lembut) sehingga perpindahan antar platform terasa konsisten.
- Copy scroll-into-view tetap memanfaatkan tab **Rekap Detail** pada `InsightLayout`, jadi tombol rekap bawaan tetap menggulir ke section ini tanpa perubahan perilaku.
- Tabel rekap personel memakai layout standar: header lengket beraksen biru/indigo, pencarian di kanan atas, baris bergaya zebra dengan badge status (Sudah/Kurang/Belum/Tanpa Username/Tidak ada posting), serta pagination kompak yang konsisten di Instagram maupun TikTok.
- Status baris TikTok kini mengikuti logika ringkasan (>=50% komentar dianggap **Sudah**, 0 dianggap **Belum**, nilai di antaranya **Kurang**), sedangkan baris tanpa username dibedakan warna khusus agar operator langsung tahu akun yang perlu dibersihkan.
- Komponen `RekapKomentarTiktok` dipindahkan ke folder `components/comments/tiktok/Rekap` dan disusun ulang mengikuti struktur, workflow, dan API `RekapLikesIG` (sorting pangkat/client, pagination persistent, tombol salin rekap serta teks siap kirim) untuk mempermudah reuse lintas platform.

## Pola tab dan CTA konsisten
- Header memakai tab **Dashboard Insight** dan **Rekap Detail** via `DEFAULT_INSIGHT_TABS` pada `InsightLayout` dengan `activeTab` dan `handleTabChange`, menyamakan pola dengan halaman Instagram.
- Tombol **Buka Rekap Detail** otomatis menggulir ke section rekap ketika tab rekap dipilih, menjaga konteks halaman.
- Tombol **Salin Rekap** dipindahkan ke header bersama filter agar saluran tindakan utama konsisten dengan halaman Instagram Engagement Insight.
- Header, filter tanggal, dan kontrol lingkup kini dibungkus `heroContent` yang diberikan ke `InsightLayout` sehingga struktur halaman TikTok dan Instagram identik dan tidak lagi memakai layout khusus untuk TikTok.

## Ringkasan mengikuti standar rekap likes
- Kartu ringkasan memakai gaya bawaan `SummaryItem` (border biru lembut, glow gradasi) seperti halaman **Rekap Likes IG**, dengan enam metrik tetap: jumlah post TikTok, total user, sudah/kurang/belum komentar, dan tanpa username.
- Ikon dan warna mengikuti palet likes Instagram agar navigasi lintas halaman terasa mulus, sekaligus menampilkan persentase kepatuhan untuk status sudah/kurang/belum komentar serta kualitas data username.
- Tiga kartu insight singkat tetap hadir, kini memakai aksen biru standar dan menyertakan persentase aksi yang dibutuhkan maupun kelengkapan username agar narasi selaras dengan halaman rekap likes.

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
- Blok judul di atas tabel rekap menambahkan heading dan deskripsi beraksen biru agar konteks performa TikTok langsung terbaca dan konsisten dengan rekap Instagram.【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L68-L75】
- Kontrol pencarian memakai label uppercase ala Instagram dengan container ber-border lembut, ikon kaca pembesar, serta placeholder yang mengarahkan pengguna mencari caption atau tanggal publikasi; filter kini menelusuri teks caption maupun label tanggal yang diformat agar selaras dengan panduan copywriting rekap Instagram.【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L34-L45】【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L81-L97】
