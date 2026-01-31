# TikTok Engagement Insight

Halaman **/comments/tiktok** kini menggabungkan wawasan grafik dan rekap komentar ke dalam satu tampilan dengan pola yang sama seperti **/likes/instagram**: tab dan header ditangani oleh `InsightLayout` sehingga tampilan tidak lagi memakai layout khusus. Pengguna dapat memilih periode data (harian, bulanan, atau rentang kustom) sekaligus melihat tabel detail personel tanpa berpindah halaman.

## Rekap detail selaras dengan Instagram
- Section **Rekapitulasi Engagement TikTok** memakai kerangka UI yang sama dengan segment rekap Instagram (pola kartu putih dengan border biru, judul tebal, dan deskripsi biru lembut) sehingga perpindahan antar platform terasa konsisten.
- Copy scroll-into-view tetap memanfaatkan tab **Rekap Detail** pada `InsightLayout`, jadi tombol rekap bawaan tetap menggulir ke section ini tanpa perubahan perilaku.
- Tabel rekap personel memakai layout standar: header lengket beraksen biru/indigo, pencarian di kanan atas, baris bergaya zebra dengan badge status (Sudah/Kurang/Belum/Tanpa Username/Tidak ada posting), serta pagination kompak yang konsisten di Instagram maupun TikTok.
- Status baris TikTok kini mengikuti logika ringkasan (komentar lengkap = **Sudah**, komentar di bawah 100% = **Kurang**, 0 = **Belum**), sedangkan baris tanpa username dibedakan warna khusus agar operator langsung tahu akun yang perlu dibersihkan.
- Jumlah pelaksanaan per personel kini dikunci ke total tugas (jumlah konten TikTok pada periode) sehingga tabel tidak lagi menampilkan angka komentar yang melebihi target harian.
- Komponen `RekapKomentarTiktok` dipindahkan ke folder `components/comments/tiktok/Rekap` dan disusun ulang mengikuti struktur, workflow, dan API `RekapLikesIG` (sorting pangkat/client, pagination persistent, tombol salin rekap serta teks siap kirim) untuk mempermudah reuse lintas platform.

## Pola tab dan CTA konsisten
- Header memakai tab **Dashboard Insight** dan **Rekap Detail** via `DEFAULT_INSIGHT_TABS` pada `InsightLayout` dengan `activeTab` dan `handleTabChange`, menyamakan pola dengan halaman Instagram.
- Tombol **Buka Rekap Detail** otomatis menggulir ke section rekap ketika tab rekap dipilih, menjaga konteks halaman.
- Tombol **Salin Rekap** dipindahkan ke header bersama filter agar saluran tindakan utama konsisten dengan halaman Instagram Engagement Insight.
- Header, filter tanggal, dan kontrol lingkup kini dibungkus `heroContent` yang diberikan ke `InsightLayout` sehingga struktur halaman TikTok dan Instagram identik dan tidak lagi memakai layout khusus untuk TikTok.
- Segmen `heroContent` (selector periode dengan label uppercase, kontrol lingkup Ditbinmas, tombol **Salin Rekap** berwarna teal, serta fallback prompt ketika clipboard diblokir) menjadi standar konsesi: pola dari TikTok Engagement Insight kini dipakai ulang pada halaman Instagram Engagement Insight agar alur filter dan penyalinan rekap benar-benar seragam di kedua platform.
- Header insight kini menambahkan CTA **Premium** di sisi kanan (prop `headerAction` pada `InsightLayout`). Tombol ini memakai gaya gradasi biru–ungu dan mengarah ke rute **/premium** untuk membuka detail paket premium serta formulir pendaftaran. CTA disejajarkan dengan grup tab agar tetap terbaca di desktop maupun mobile.
- Panel CTA lengket di bagian bawah (tombol salin rekap dan link Premium) tidak lagi dibatasi `max-w-4xl`; lebar bar mengikuti kontainer induk sehingga panel di `RekapLikesIG` dan `RekapKomentarTiktok` selaras dengan tabel dan tidak terpotong pada layar lebar.

## Ringkasan mengikuti standar rekap likes
- Kartu ringkasan memakai gaya bawaan `SummaryItem` (border biru lembut, glow gradasi) seperti halaman **Rekap Likes IG**, dengan enam metrik tetap: jumlah post TikTok, total user, sudah/kurang/belum komentar, dan tanpa username.
- Ikon dan warna mengikuti palet likes Instagram agar navigasi lintas halaman terasa mulus, sekaligus menampilkan persentase kepatuhan untuk status sudah/kurang/belum komentar serta kualitas data username.
- Tiga kartu insight singkat tetap hadir, kini memakai aksen biru standar dan menyertakan persentase aksi yang dibutuhkan maupun kelengkapan username agar narasi selaras dengan halaman rekap likes.

## Pengaturan periode
- Komponen `ViewDataSelector` dipakai untuk memilih periode dan tanggal terkait dan kini dikelola oleh hook bersama `useLikesDateSelector` agar logika pemilihan tanggal tetap konsisten dengan halaman Instagram.
- `useLikesDateSelector` mempertahankan perilaku lama: untuk mode `custom_range`, tanggal awal dan akhir akan otomatis ditukar jika pengguna memilih rentang terbalik.
- Mode `month` menggunakan format `YYYY-MM` agar konsisten dengan API.
- `getRekapKomentarTiktok` mengirimkan pasangan `tanggal_mulai`/`tanggal_selesai` sekaligus alias `start_date`/`end_date` sehingga backend terbaru yang mewajibkan nama Indonesia tetap bekerja berdampingan dengan adapter lama, selaras dengan pola filter tanggal pada rekap likes Instagram dan dashboard stats.

## Ruang lingkup Ditbinmas
Kontrol **Lingkup Data** hanya muncul untuk role direktorat tertentu (Ditbinmas/Ditsamapta/Ditlantas/Bidhumas) agar pengguna bisa memilih antara data `client` aktif atau cakupan **Satker Jajaran**. Saat scope disetel ke satker jajaran, grafik insight otomatis dikelompokkan per `client_id` (Polres) agar ringkasan tetap terbaca, sedangkan scope `client` tetap menampilkan rekap per divisi/satfung. Role **operator** tetap dikunci ke `client_id` login untuk mengambil data statistik, profil, dan rekap komentar.

## Perubahan hook
`useTiktokCommentsData` kini menormalisasi payload `/api/tiktok/rekap-komentar` agar field komentar yang dikirim backend (mis. `comments`/`comment_count`) tetap dikonsumsi sebagai `jumlah_komentar`, termasuk fallback username serta metadata client/divisi. Hook juga memetakan key root baru (`usersCount`, `totalPosts`, `sudahUsersCount`, `kurangUsersCount`, `belumUsersCount`, `usersWithCommentsCount`, `usersWithoutCommentsCount`, `noUsernameUsersCount`) ke `summary.totalUsers`, `summary.totalPosts`, dan `summary.distribution` ketika backend mengirim response `{ success: true, ... }`, sehingga layer UI tetap membaca data ringkasan dari struktur `summary`. Seluruh data chart serta ringkasan rekap TikTok Engagement Insight kini bersumber dari response endpoint ini (dengan parameter `role`, `scope`, dan `regional_id`), termasuk pembacaan `summary.totalPosts`, `summary.totalUsers`, dan distribusi status (`summary.distribution.sudah/kurang/belum/noUsername/noPosts`). Jika summary tidak dikirim, hook menghitung ulang ringkasan dari daftar `users` yang sama agar tetap konsisten tanpa fallback ke dashboard stats. Penggunaan `DEFAULT_INSIGHT_TABS` tidak mengubah alur salin rekap; tampilan tetap mengikuti pola insight lintas platform.

Mulai pembaruan backend Cicero_V2, pemanggilan `/api/tiktok/rekap-komentar` selalu menyertakan payload `role`, `scope`, dan `regional_id` (bila tersedia dari profil login). Kombinasi ini memastikan backend dapat mengeksekusi standar terbaru: scope **DIREKTORAT** mengambil tugas berdasarkan `client_id` login dan merangkum personel dengan role sepadan, scope **ORG** dengan role direktorat mengambil tugas direktorat terkait, sementara scope **ORG** dengan role operator hanya mengambil tugas `client_id` operator serta personel ber-role operator.

Mulai Oktober 2024, hook ini memaksa pengambilan direktori user memakai `client_id` direktorat hanya saat `effectiveClientType` benar-benar **DIREKTORAT**. Akun bertipe **ORG** selalu memakai `client_id` login untuk statistik, profil, dan rekap sehingga tidak ada fan-out pemanggilan profil berdasarkan daftar `client_id`.

Per April 2025, pencocokan nama client direktorat untuk TikTok Engagement Insight tidak lagi memanggil `/api/clients/profile` untuk daftar `client_id`. Hook kini memanfaatkan data direktori yang sudah diambil agar profil yang dipanggil hanya milik `client_id` login, sesuai kebutuhan pembatasan request.

Per Mei 2025, pemanggilan `/api/tiktok/rekap-komentar` tidak lagi di-fan-out berdasarkan daftar `client_id`. Hook memanggil endpoint ini satu kali dengan `client_id` login serta payload `role`/`scope`, lalu memfilter hasil agar tetap sesuai satker login tanpa opsi cakupan satker jajaran.

Per November 2024, jalur bertipe klien **DIREKTORAT** tidak lagi memaksa `client_id` Ditbinmas untuk mengambil data statistik atau tugas. Untuk tipe klien ini, hook mempertahankan `client_id` login ketika menghitung metrik dashboard maupun daftar tugas sehingga satker direktorat non-Ditbinmas tidak lagi melihat data dari Ditbinmas.

## Kompatibilitas rute lama
Rute lama `/comments/tiktok/rekap` kini mengalihkan ke halaman utama `/comments/tiktok` untuk menjaga tautan eksisting tanpa menggandakan UI.

## Rekap Post TikTok

Halaman `/posts/tiktok` mengikuti pola tab insight/rekap yang sama dengan Instagram dan komentar TikTok:

- Header filter menambahkan dropdown **Lingkup** bagi Ditbinmas/direktorat yang memenuhi syarat, memfilter tampilan antara klien aktif (`client`) atau seluruh satker jajaran (`all`). Tombol **Salin Rekap** berdampingan agar pesan WhatsApp otomatis mengikuti cakupan yang dipilih.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L26-L138】【F:cicero-dashboard/app/posts/tiktok/page.jsx†L250-L329】
- Utilitas `buildTiktokPostRekap` membangkitkan ringkasan performa (post per hari, rata-rata views/likes/komentar/share, engagement rate, rasio follower/following, top 3 post) dan disalin via clipboard bila tersedia.【F:cicero-dashboard/utils/tiktokPostRekap.ts†L1-L76】
- Tab rekap menampilkan komponen `RekapTiktokPosts` dengan narasi kontekstual dan tabel metrik per post (pencarian + pagination), sehingga operator dapat menjelajahi konten tanpa meninggalkan dashboard insight.【F:cicero-dashboard/app/posts/tiktok/page.jsx†L360-L470】【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L1-L170】
- Blok judul di atas tabel rekap menambahkan heading dan deskripsi beraksen biru agar konteks performa TikTok langsung terbaca dan konsisten dengan rekap Instagram.【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L68-L75】
- Kontrol pencarian memakai label uppercase ala Instagram dengan container ber-border lembut, ikon kaca pembesar, serta placeholder yang mengarahkan pengguna mencari caption atau tanggal publikasi; filter kini menelusuri teks caption maupun label tanggal yang diformat agar selaras dengan panduan copywriting rekap Instagram.【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L34-L45】【F:cicero-dashboard/components/likes/tiktok/Rekap/RekapTiktokPosts.jsx†L81-L97】
