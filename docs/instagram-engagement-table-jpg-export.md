# Export Tabel JPG — Rekap Instagram Engagement

Dokumen ini menjelaskan skenario penggunaan, mekanisme teknis, penanganan error, serta acceptance criteria QA untuk fitur **Download Tabel JPG** pada tab **Rekap Instagram**.

## 1) Skenario Penggunaan

1. User membuka halaman **Instagram Engagement Insight**.
2. User masuk ke tab **Rekap Instagram**.
3. User memilih cakupan data (scope), termasuk opsi **Satker Jajaran** bila relevan terhadap role.
4. User mengatur filter yang dibutuhkan (mis. pencarian/nama satker/status), lalu menentukan periode laporan.
5. User memastikan data di tabel sudah sesuai kebutuhan.
6. User menekan tombol **Download Tabel JPG**.
7. Sistem memproses render area rekap dan mengunduh file gambar `.jpg` ke perangkat user.

## 2) Mekanisme Teknis

### Area DOM yang di-capture

- Sistem hanya menangkap area konten rekap yang sudah disiapkan untuk export (kontainer export), bukan seluruh halaman browser.
- Kontainer export mencakup:
  - Header laporan export.
  - Metadata konteks laporan (periode/mode rekap bila tersedia).
  - Tabel rekap yang sedang aktif sesuai state filter saat ini.

### Header wajib

Header pada hasil gambar **wajib** menampilkan teks:

> **Data Pelaksanaan Engagement Instagram Satker Jajaran**

Header ini menjadi identitas standar laporan saat dibagikan lintas kanal (mis. grup koordinasi).

### Format file, nama file, dan kualitas gambar

- **Format output:** `.jpg`
- **Pola nama file (disarankan):**
  - `instagram-engagement-rekap-<scope>-<periode>-<timestamp>.jpg`
  - Contoh: `instagram-engagement-rekap-satker-jajaran-2026-02-01_s-d_2026-02-20-1708402000.jpg`
- **Kualitas gambar:** gunakan mode kualitas tinggi/optimal agar teks tabel tetap terbaca jelas saat dibuka di ponsel maupun desktop.

## 3) Error Handling

### Gagal render/capture

- Jika render/capture gagal (mis. elemen belum siap atau proses canvas gagal), sistem menampilkan notifikasi gagal (toast/error message) yang jelas dan dapat ditindaklanjuti.
- Tombol download kembali ke state normal (tidak loading) agar user dapat mencoba ulang.

### Kompatibilitas browser

- Pada browser yang tidak mendukung penuh API rendering/canvas tertentu, sistem menampilkan pesan bahwa export JPG belum optimal di browser tersebut.
- Rekomendasi fallback: gunakan browser berbasis Chromium/versi terbaru untuk hasil paling stabil.

### Data kosong

- Jika tabel kosong sesuai filter/periode aktif, sistem tetap menampilkan umpan balik yang jelas:
  - Opsi 1: mencegah export dan meminta user menyesuaikan filter/periode.
  - Opsi 2: tetap export dengan isi laporan kosong namun header + metadata tetap tersedia untuk jejak audit.
- Pilihan implementasi harus konsisten dengan kebijakan UX produk yang berlaku.

## 4) Acceptance Criteria QA

1. Saat user menekan **Download Tabel JPG**, file `.jpg` berhasil diunduh.
2. Header **"Data Pelaksanaan Engagement Instagram Satker Jajaran"** muncul pada hasil JPG.
3. Isi tabel pada JPG sesuai dengan **scope, filter, dan periode** yang aktif saat tombol diklik.
4. File JPG dapat dibuka normal (preview/load tanpa korup) di:
   - perangkat desktop,
   - perangkat mobile,
   - aplikasi galeri/viewer umum.

## 5) Kompatibilitas & Batasan

- Tabel sangat panjang dapat menghasilkan gambar dengan dimensi tinggi, yang berpotensi:
  - menurunkan performa render,
  - memperbesar ukuran file,
  - membuat teks kecil saat pratinjau otomatis.
- Jika tabel menggunakan paginasi, export hanya menangkap data yang ada pada area/halaman aktif saat ini (kecuali ada implementasi khusus untuk merge multi-halaman).
- Perbedaan rendering font antar OS/browser dapat menyebabkan variasi minor pada spasi dan line break.
- Pada perangkat dengan memori terbatas, proses export bisa lebih lambat atau gagal pada data sangat besar.

## Rekomendasi Operasional

- Sebelum export, pastikan filter dan periode sudah final.
- Untuk kebutuhan arsip formal, lakukan verifikasi cepat pada hasil JPG (header, periode, dan jumlah baris penting).
- Untuk dataset besar, pertimbangkan export bertahap per halaman/periode agar hasil tetap terbaca.
