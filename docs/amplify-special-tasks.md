# Amplifikasi Tugas Khusus

Dokumen ini menjelaskan fitur amplifikasi tugas khusus yang ditambahkan pada halaman Diseminasi Insight, termasuk fitur upload tugas khusus yang baru.

## Ringkasan

Fitur ini menambahkan halaman baru untuk melihat data amplifikasi tugas khusus, mengikuti standar halaman amplifikasi yang sudah ada. **Update terbaru** menambahkan tab "Upload Tugas Khusus" untuk mengunggah data tugas dalam format CSV, Excel, atau JSON.

## Halaman Baru

### 1. `/amplify/khusus` - Halaman Amplifikasi Tugas Khusus
Halaman ini menampilkan insight amplifikasi untuk tugas khusus dengan fitur:
- Dashboard insight dengan kartu ringkasan (Total Link, Total User, Sudah Post, Belum Post)
- Visualisasi per divisi (BAG, SAT, SI & SPKT, LAINNYA, POLSEK)
- Filter periode (harian, mingguan, bulanan, custom range)
- Quick insights untuk kepatuhan amplifikasi
- Tombol salin rekap untuk berbagi via WhatsApp
- **[NEW]** Tab Upload untuk mengunggah data tugas khusus

### 2. `/amplify/khusus/rekap` - Halaman Rekap Amplifikasi Tugas Khusus
Halaman ini menampilkan tabel rekap detail dengan:
- Status posting per user (Sudah/Belum)
- Jumlah link yang dibagikan per user
- Filter pencarian (nama, username, divisi, client)
- Pagination untuk data besar
- Indikator visual (baris hijau untuk sudah post, merah untuk belum)

## Navigasi

### Dari Halaman Amplifikasi Rutin ke Tugas Khusus
Di halaman `/amplify`, terdapat tombol "Tugas Khusus" di header (warna orange/amber) yang mengarahkan ke halaman tugas khusus.

### Dari Halaman Tugas Khusus ke Amplifikasi Rutin
Di halaman `/amplify/khusus`, terdapat tombol "Tugas Rutin" di header (warna biru/sky) yang mengarahkan kembali ke halaman amplifikasi rutin.

## API Endpoint

Backend API yang digunakan:
- `GET /api/amplify/rekap-khusus` - Endpoint untuk mengambil data amplifikasi tugas khusus
  
Parameter query yang sama dengan endpoint regular:
- `client_id`: ID klien
- `periode`: Periode rekap (harian, mingguan, bulanan, custom)
- `tanggal`: Tanggal spesifik (untuk periode harian)
- `tanggal_mulai`, `tanggal_selesai`: Range tanggal (untuk periode custom)
- `role`: Role user (untuk filtering akses)
- `scope`: Scope akses (DIREKTORAT/ORG)
- `regional_id`: ID regional (bila tersedia)

Response format yang sama dengan endpoint regular:
```json
{
  "data": [
    {
      "user_id": "...",
      "nama": "...",
      "username": "...",
      "divisi": "...",
      "client_id": "...",
      "jumlah_link": 5
    }
  ]
}
```

## Implementasi Frontend

### File Baru
1. `cicero-dashboard/app/amplify/AmplifyKhususInsightView.jsx` - Komponen utama untuk insight tugas khusus
2. `cicero-dashboard/app/amplify/khusus/page.jsx` - Route page untuk insight
3. `cicero-dashboard/app/amplify/khusus/rekap/page.jsx` - Route page untuk rekap

### File yang Dimodifikasi
1. `cicero-dashboard/utils/api.ts` - Menambahkan fungsi `getRekapAmplifyKhusus()`
2. `cicero-dashboard/utils/amplifyRekap.ts` - Menambahkan parameter `titlePrefix` untuk rekap
3. `cicero-dashboard/app/amplify/AmplifyInsightView.jsx` - Menambahkan tombol navigasi ke tugas khusus

### Komponen yang Digunakan Kembali
- `RekapAmplifikasi` - Tabel rekap amplifikasi
- `InsightLayout` - Layout standar untuk insight pages
- `EngagementInsightMobileScaffold` - Scaffold untuk mobile dan desktop
- `ChartBox` dan `ChartHorizontal` - Visualisasi data per divisi

## Cara Menggunakan

1. Login ke dashboard Cicero
2. Navigasi ke menu "Diseminasi Insight" di sidebar
3. Di halaman amplifikasi regular, klik tombol "Tugas Khusus" di header
4. Pilih periode yang diinginkan menggunakan selector di atas
5. Lihat insight dan visualisasi amplifikasi tugas khusus
6. Klik tab "Rekap Detail" untuk melihat tabel detail per user
7. **[NEW]** Klik tab "Upload Tugas Khusus" untuk mengunggah data tugas baru
8. Gunakan tombol "Salin Rekap" untuk menyalin ringkasan ke clipboard
9. Untuk kembali ke amplifikasi rutin, klik tombol "Tugas Rutin"

## Upload Tugas Khusus (New Feature)

### Overview
Tab "Upload Tugas Khusus" memungkinkan pengguna untuk mengunggah data tugas khusus secara bulk menggunakan file CSV, Excel, atau JSON.

### Supported File Formats
1. **CSV** - Comma-separated values
2. **Excel** - .xlsx atau .xls
3. **JSON** - JavaScript Object Notation

### Required Fields
- `judul` / `title` - Judul tugas khusus
- `deskripsi` / `description` - Deskripsi tugas (optional)
- `link_konten` / `content_link` - URL konten untuk diamplifikasi
- `tanggal_mulai` / `start_date` - Tanggal mulai (format: YYYY-MM-DD)
- `tanggal_selesai` / `end_date` - Tanggal selesai (format: YYYY-MM-DD)

### File Example (CSV)
```csv
judul,deskripsi,link_konten,tanggal_mulai,tanggal_selesai
Kampanye HUT RI,Amplifikasi konten HUT RI ke-78,https://instagram.com/p/abc123,2024-08-01,2024-08-17
Sosialisasi Vaksin,Kampanye awareness vaksinasi,https://instagram.com/p/def456,2024-09-01,2024-09-30
```

### Upload Process
1. Click the upload area or drag & drop file
2. File will be validated (type and size)
3. Review file details
4. Click "Upload File" button
5. Wait for upload to complete
6. Data will be automatically refreshed

### Validations
- Maximum file size: 10MB
- Valid URL format required for content links
- Date format must be YYYY-MM-DD
- All required fields must be filled

### Backend Implementation
Backend harus mengimplementasikan endpoint upload. Lihat dokumentasi lengkap di:
- [Upload Tugas Khusus Implementation Guide](./upload-tugas-khusus.md)

**Expected Endpoint:** `POST /api/tasks/special/upload` atau `POST /api/amplify/upload-khusus`

## Perbedaan dengan Amplifikasi Rutin

### Tugas Rutin
- Menampilkan data amplifikasi link harian regular
- Menggunakan endpoint `/api/amplify/rekap`
- Fokus pada distribusi link posting rutin

### Tugas Khusus
- Menampilkan data amplifikasi untuk tugas khusus (kampanye tematik)
- Menggunakan endpoint `/api/amplify/rekap-khusus`
- Fokus pada distribusi link untuk konten khusus/special
- Data terpisah dari tugas rutin

## Catatan Implementasi

1. Mengikuti pola yang sama dengan halaman amplifikasi existing
2. Menggunakan komponen yang sudah ada untuk konsistensi UI/UX
3. Minimal changes - hanya menambahkan halaman baru tanpa mengubah fungsionalitas existing
4. Backend endpoint diasumsikan sudah ada di Cicero_V2 backend (sama seperti endpoint regular)
