# Cicero_V2 Backend Helpers

Modul di folder `backend/src` fokus pada integrasi Google Contacts dengan kredensial service account serta utilitas WhatsApp.

## Struktur
- `config/googleContactsConfig.js` – membaca path `credentials.json` dari environment variable `GOOGLE_CONTACTS_CREDENTIALS_PATH` atau fallback ke `config/google-contacts/credentials.json`.
- `health/googleContactsHealthCheck.js` – memvalidasi bahwa file kredensial dapat dibaca dan memberi pesan error yang jelas bila tidak ditemukan.
- `services/googleContactsService.js` – memuat kredensial dan menyiapkan fondasi penyimpanan kontak, termasuk validasi payload kontak.
- `startup/healthChecks.js` – jalankan health check pada saat start untuk mencegah sinkronisasi kontak dilewati diam-diam.
- `services/whatsappContactHelper.js` – lookup kontak WhatsApp melalui `store.Contact.get(contactId)` dan membaca flag `isMyContact`/`isBlocked` tanpa memanggil helper legacy yang sudah dihapus dari WhatsApp Web Store.
- `services/cronDirRequestDirektorat.js` – menyusun jadwal pengiriman laporan direktorat berbasis data tabel `clients`. Klien bertipe **Direktorat** dengan status aktif dan bendera `instagram` serta `tiktok` bernilai `true` akan dijadwalkan otomatis. `DITBINMAS` hanya dikirimi laporan ke super admin pada jam lama (default `20:30`), sedangkan `BIDHUMAS` mendapat pengiriman ke grup pada `15:05` dan `18:05` serta pengiriman ganda ke grup dan super admin pada jam lama. Klien direktorat lain dikirimi laporan grup pada jam lama. Gunakan `scheduleJob(time, handler, meta)` untuk mendaftarkan job dan `sendGroupReport`/`sendSuperAdminReport` untuk eksekusi pesan.

## Pengujian

```
npm install
npm test
```

Tes Jest (`__tests__/whatsappContactHelper.test.js`) memverifikasi evaluasi `getContact` tidak lagi melempar error saat kontak tidak ditemukan dan memastikan helper hanya memakai properti yang didukung di WhatsApp Web Store.

Gunakan file `docs/google_contacts_service_account.md` untuk panduan lengkap membuat dan menempatkan `credentials.json`.
