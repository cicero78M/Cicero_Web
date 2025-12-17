# Cicero_V2 Backend Helpers

Modul di folder `backend/src` fokus pada integrasi Google Contacts dengan kredensial service account serta utilitas WhatsApp.

## Struktur
- `config/googleContactsConfig.js` – membaca path `credentials.json` dari environment variable `GOOGLE_CONTACTS_CREDENTIALS_PATH` atau fallback ke `config/google-contacts/credentials.json`.
- `health/googleContactsHealthCheck.js` – memvalidasi bahwa file kredensial dapat dibaca dan memberi pesan error yang jelas bila tidak ditemukan.
- `services/googleContactsService.js` – memuat kredensial dan menyiapkan fondasi penyimpanan kontak, termasuk validasi payload kontak.
- `startup/healthChecks.js` – jalankan health check pada saat start untuk mencegah sinkronisasi kontak dilewati diam-diam.
- `services/whatsappContactHelper.js` – lookup kontak WhatsApp melalui `store.Contact.get(contactId)` dan membaca flag `isMyContact`/`isBlocked` tanpa memanggil helper legacy yang sudah dihapus dari WhatsApp Web Store.
- `jobs/runDitbinmasRecapAndCustomSequence.js` – cron helper yang menjalankan rekap Ditbinmas lalu mengeksekusi menu dirrequest 6, 9, 34, dan 35 secara berurutan hanya ke Super Admin dengan jeda 2 menit di antara tiap eksekusi.

## Pengujian

```
npm install
npm test
```

Tes Jest (`__tests__/whatsappContactHelper.test.js`) memverifikasi evaluasi `getContact` tidak lagi melempar error saat kontak tidak ditemukan dan memastikan helper hanya memakai properti yang didukung di WhatsApp Web Store.

## Cron Ditbinmas: Recap + Dirrequest Sequence

Gunakan `runDitbinmasRecapAndCustomSequence` ketika cron job harus menjalankan rekap Ditbinmas dan menindaklanjutinya dengan menu dirrequest 6, 9, 34, dan 35 ke Super Admin saja.

```js
const {
  runDitbinmasRecapAndCustomSequence,
} = require('./src/jobs/runDitbinmasRecapAndCustomSequence');

await runDitbinmasRecapAndCustomSequence({
  runDitbinmasRecap: async (recipient) => sendRecapTo(recipient),
  executeDirrequestMenu: async (menuId, { recipient }) => triggerMenu(menuId, recipient),
  superAdminRecipient: '<super-admin-id>',
  // opsional: delayMs dan sequence dapat dioverride bila diperlukan
});
```

Helper ini mengirim menu ke Super Admin saja (`audience: "super_admin"`) dan memakai jeda default 2 menit antar menu sehingga penjadwalan tidak menumpuk dalam satu waktu.

Gunakan file `docs/google_contacts_service_account.md` untuk panduan lengkap membuat dan menempatkan `credentials.json`.
