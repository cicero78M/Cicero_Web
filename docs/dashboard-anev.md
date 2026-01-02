# Dashboard ANEV Polres

Halaman **/anev/polres** menampilkan rekap aktivitas, kepatuhan, serta performa konten lintas platform. Per Mei 2025, normalisasi payload ANEV menambahkan dukungan untuk kinerja **TikTok per satfung/divisi** agar data engagement tersaji bersama metrik platform lain.

## Normalisasi data
- Payload ANEV dapat mengirim data TikTok pada beberapa bidang (`tiktok.per_satfung`, `tiktok.posts_per_satfung`, `tiktok.engagement_per_satfung`, atau variasi objek `tiktok_per_satfung` di `aggregates.totals`). Fungsi `resolveTiktokPerformanceBySatfung` di `app/anev/polres/page.tsx` men-scan kandidat tersebut, menerima format array maupun map, dan memetakan ke `{ label, posts, engagement }`. Nilai engagement akan memakai bidang `engagement/engagements/total_engagement/interaction` bila tersedia; jika kosong, ia menjumlahkan likes, comments, dan shares di item yang sama sehingga kartu tetap terisi.【F:cicero-dashboard/app/anev/polres/page.tsx†L268-L455】
- Normalisasi satfung/divisi yang sudah ada (posting per platform, user per satfung, likes Instagram per satfung) tetap dipertahankan, sehingga penambahan TikTok tidak mengubah konsumsi data lain di halaman ini.【F:cicero-dashboard/app/anev/polres/page.tsx†L46-L265】

## UI ringkas
- Seksi **TikTok per Satfung/Divisi** menampilkan kartu per satfung/divisi berisi jumlah posting dan engagement dengan grid responsif (1–3 kolom). Empty state berpola border dashed sehingga pengguna tahu ketika payload kosong maupun filter belum menghasilkan data.【F:cicero-dashboard/app/anev/polres/page.tsx†L905-L937】
- Seksi ini ditempatkan di antara rekap user per satfung/divisi dan likes Instagram per satfung/divisi agar alur membaca tetap platform-first (TikTok → Instagram → kepatuhan). Snapshot filter, kartu metrik utama, dan tabel kepatuhan tidak berubah sehingga pengalaman premium tetap konsisten.【F:cicero-dashboard/app/anev/polres/page.tsx†L879-L1012】

Gunakan filter waktu, scope, role, dan regional ID di bagian atas halaman untuk memicu pengambilan ulang data ANEV dengan konteks baru. Empty state akan berguna sebagai indikator ketika backend belum mengembalikan metrik TikTok untuk kombinasi filter tertentu.
