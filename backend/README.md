# Cicero_V2 Backend Helpers

Modul di folder `backend/src` fokus pada integrasi Google Contacts dengan kredensial service account.

## Struktur
- `config/googleContactsConfig.js` – membaca path `credentials.json` dari environment variable `GOOGLE_CONTACTS_CREDENTIALS_PATH` atau fallback ke `config/google-contacts/credentials.json`.
- `health/googleContactsHealthCheck.js` – memvalidasi bahwa file kredensial dapat dibaca dan memberi pesan error yang jelas bila tidak ditemukan.
- `services/googleContactsService.js` – memuat kredensial dan menyiapkan fondasi penyimpanan kontak, termasuk validasi payload kontak.
- `startup/healthChecks.js` – jalankan health check pada saat start untuk mencegah sinkronisasi kontak dilewati diam-diam.

Gunakan file `docs/google_contacts_service_account.md` untuk panduan lengkap membuat dan menempatkan `credentials.json`.
