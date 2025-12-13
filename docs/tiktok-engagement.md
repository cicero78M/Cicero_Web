# TikTok Engagement Insight

Halaman **/comments/tiktok** kini menggabungkan wawasan grafik dan rekap komentar ke dalam satu tampilan. Pengguna dapat memilih periode data (harian, bulanan, atau rentang kustom) sekaligus melihat tabel detail personel tanpa berpindah halaman.

## Pola tab dan CTA konsisten
- Header memakai tab **Dashboard Insight** dan **Rekap Detail** (dengan `activeTab` dan `handleTabChange`) untuk memisahkan chart-ringkasan dan tabel rekap.
- Tombol **Buka Rekap Detail** otomatis menggulir ke section rekap ketika tab rekap dipilih, menjaga konteks halaman.
- Tombol **Salin Rekap** dipindahkan ke header bersama filter agar saluran tindakan utama konsisten dengan halaman Instagram Engagement Insight.

## Ringkasan tanpa duplikasi kartu
- Deretan kartu ringkasan disusun lewat daftar unik agar tidak ada label yang tampil ganda ketika data berganti.
- Status negatif disatukan dalam kartu **Perlu Aksi** sehingga fokus langsung pada akun yang belum memenuhi target komentar.
- Tiga kartu insight singkat di bawah ringkasan memberi konteks cerdas tentang kepatuhan, prioritas perbaikan, dan kebersihan data username.

## Pengaturan periode
- Komponen `ViewDataSelector` dipakai untuk memilih periode dan tanggal terkait.
- Untuk mode `custom_range`, tanggal awal dan akhir akan otomatis ditukar jika pengguna memilih rentang terbalik.
- Mode `month` menggunakan format `YYYY-MM` agar konsisten dengan API.

## Ruang lingkup Ditbinmas
Pengguna dengan peran Ditbinmas mendapat opsi **Lingkup Data**:
- `client` menampilkan rekap hanya untuk client aktif pengguna (default).
- `all` menampilkan gabungan seluruh client Ditbinmas. Opsi ini diteruskan ke `useTiktokCommentsData` melalui parameter `scope`.
- Kontrol lingkup hanya muncul untuk pengguna direktorat non-ORG agar satker ORG tidak melihat filter yang tidak relevan.

## Perubahan hook
`useTiktokCommentsData` sekarang menerima parameter opsional `scope` (`"client" | "all"`). Nilai `"all"` menonaktifkan filter client sehingga data rekap dapat meliputi seluruh satker Ditbinmas. Hook ini juga mengembalikan flag kesadaran ORG (`isOrgClient`) dari `effectiveClientType` ter-normalisasi supaya komponen pemanggil bisa meniadakan dropdown lingkup ketika klien bertipe ORG, sementara klien direktorat tetap dapat men-toggle opsi `client/all`.

## Kompatibilitas rute lama
Rute lama `/comments/tiktok/rekap` kini mengalihkan ke halaman utama `/comments/tiktok` untuk menjaga tautan eksisting tanpa menggandakan UI.
