# Engagement Insight Standard (Instagram & TikTok)

Dokumen ini menjadi baseline bersama untuk halaman **Instagram Engagement Insight** (`/likes/instagram`) dan **TikTok Engagement Insight** (`/comments/tiktok`) agar perubahan berikutnya tetap parity lintas platform.

## 1) Struktur Halaman

- Wajib memakai `InsightLayout` sebagai shell utama untuk:
  - Header halaman.
  - Tab bawaan (`Dashboard Insight`, `Rekap Detail`).
  - Integrasi `heroContent` (filter periode, scope, selector client direktorat, aksi utama).
- Konten tab insight/rekap wajib dibungkus scaffold yang sama (mis. `EngagementInsightMobileScaffold`) agar perilaku mobile-desktop konsisten.
- Section rekap wajib punya anchor/target scroll yang stabil agar aksi "Buka Rekap Detail" dari header/tab selalu mendarat pada section yang benar.
- Struktur minimum tab rekap:
  - Ringkasan metrik (kartu summary).
  - Quick insights (narasi singkat prioritas aksi).
  - Tabel rekap personel (search, status badge, pagination).

## 2) Standar Data Flow

- Input hook insight wajib eksplisit dan stabil: token/session auth, `client_id`, role efektif (`effectiveRole`), tipe klien efektif (`effectiveClientType`), `scope`, `regional_id`, dan parameter periode (`periode`, `tanggal`, `tanggal_mulai`, `tanggal_selesai`).
- Satu sumber data utama per halaman:
  - Instagram: payload `/api/insta/rekap-likes`.
  - TikTok: payload `/api/tiktok/rekap-komentar`.
- Summary derivation wajib mengikuti urutan:
  1. Gunakan `summary` dari backend bila tersedia.
  2. Jika `summary` tidak lengkap, hitung ulang dari daftar user yang sama (tanpa endpoint tambahan).
- Scope/directorate/client selection:
  - Scope `client/all` harus ditangani di level hook sesuai role dan metadata profil.
  - Selector client direktorat dipakai untuk drill-down view, tetapi tidak memecah kontrak summary utama.
  - Ketika selector aktif, chart + quick insights + tabel wajib memakai dataset terfilter yang sama.

## 3) Standar UX Actions

- **Copy Rekap** harus tersedia pada area aksi utama (header/hero) dan menghasilkan copy siap kirim (WhatsApp-friendly).
- **Scroll-to-Rekap** harus terhubung dengan tab/CTA (`Rekap Detail` / `Buka Rekap Detail`) dan menggunakan anchor yang konsisten.
- **Premium CTA** wajib hadir dengan pola yang seragam lintas platform:
  - Label premium yang konsisten.
  - Deskripsi singkat manfaat automasi.
  - Tombol aksi menuju `/premium`.
- State disable/loading untuk aksi penting (copy, komplain, filter) wajib jelas agar operator paham kapan data siap dipakai.

## 4) Standar Visual & Copy

- Tone visual utama: palet biru yang konsisten untuk kartu summary, quick insight, tab aktif, dan badge informatif lintas platform.
- Kartu ringkasan:
  - Menjaga pola layout/spacing/ikon seragam antar halaman.
  - Menampilkan metrik inti yang setara (total post, total user, sudah/kurang/belum, tanpa username bila relevan).
- Quick insights:
  - Gunakan copy operasional yang jelas dan langsung bisa ditindak (contoh: "masih perlu aksi", "belum melakukan ...").
  - Sertakan fallback aman ketika data tidak tersedia (`n/a` atau teks ekuivalen).
- Copy status tabel (Sudah/Kurang/Belum/Tanpa Username/Tidak ada posting) harus konsisten makna dan semantik warnanya.

## 5) Parity Acceptance Criteria (Checklist PR)

Gunakan checklist ini untuk review setiap PR yang menyentuh insight engagement Instagram/TikTok:

- [ ] Struktur halaman masih memakai `InsightLayout` + tab standar (`Dashboard Insight`, `Rekap Detail`).
- [ ] CTA/tab rekap tetap bisa scroll ke section rekap yang benar.
- [ ] Data utama tetap satu sumber endpoint rekap per platform (tanpa fan-out endpoint yang tidak perlu).
- [ ] Ringkasan tetap sinkron dengan dataset yang ditampilkan (backend summary atau derivasi dari list user yang sama).
- [ ] Scope `client/all` dan selector client direktorat tidak menghasilkan mismatch antara chart, quick insights, dan tabel rekap.
- [ ] Tombol **Copy Rekap** tetap tersedia dan menghasilkan format copy siap kirim.
- [ ] Premium CTA masih tampil dan mengarah ke `/premium`.
- [ ] Visual kartu ringkasan + quick insights tetap parity lintas Instagram/TikTok (tone, spacing, hierarchy).
- [ ] Status badge dan copy aksi tabel tetap konsisten (Sudah/Kurang/Belum/Tanpa Username/Tidak ada posting).
- [ ] Tidak ada regresi UX penting (loading, empty state, disabled state pada aksi utama).
