# Google Contacts Service Account (Cicero_V2 Backend)

Dokumen ini menjelaskan cara menyiapkan kredensial layanan Google Contacts untuk backend **Cicero_V2** serta bagaimana aplikasinya memverifikasi keberadaan file secara dini.

## Membuat `credentials.json`
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat **Service Account** baru (Role minimal: *Editor* atau peran khusus yang mengizinkan akses People API*).
3. Buka menu **APIs & Services → Library**, aktifkan **People API** untuk project tersebut.
4. Di halaman service account, buat kunci baru bertipe **JSON** dan unduh berkasnya.
5. Simpan berkas sebagai `credentials.json` dan letakkan di salah satu lokasi berikut:
   - Default: `config/google-contacts/credentials.json` (direlative ke root repo Cicero_V2).
   - Kustom: setel environment variable `GOOGLE_CONTACTS_CREDENTIALS_PATH=/path/to/credentials.json`.

> Pastikan direktori tujuan dapat dibaca oleh proses Node.js yang menjalankan backend.

## Integrasi pada Backend
- Modul penyimpan kontak membaca lokasi kredensial melalui `GOOGLE_CONTACTS_CREDENTIALS_PATH` dengan fallback ke path default.
- Jika file tidak ada atau tidak bisa dibaca, modul akan melempar error eksplisit yang menyebut lokasi yang dicari sehingga operator tahu harus menaruh berkasnya.
- Fungsi startup `runStartupHealthChecks` menjalankan pemeriksaan awal untuk memastikan file kredensial tersedia sebelum backend melayani permintaan.

## Menjalankan Health Check Saat Boot
Panggil helper berikut di entrypoint backend (misal `index.js` atau saat server Express diinisialisasi):

```js
const { runStartupHealthChecks } = require('./src/startup/healthChecks');

async function bootstrap() {
  await runStartupHealthChecks();
  // lanjutkan menginisialisasi server / queue worker
}

bootstrap().catch((error) => {
  console.error('Backend gagal start karena health check:', error);
  process.exit(1);
});
```

Health check akan menghentikan proses start jika `credentials.json` tidak ditemukan atau tidak terbaca, sehingga tidak ada proses yang diam-diam melewatkan sinkronisasi kontak.

## Rotasi dan Audit
- Simpan salinan cadangan `credentials.json` di vault yang terenkripsi dan batasi akses.
- Catat penanggung jawab rotasi dan jadwalkan penggantian kunci secara berkala.
- Setelah rotasi, perbarui environment variable atau salin file baru ke path default lalu jalankan ulang layanan untuk memicu health check.
