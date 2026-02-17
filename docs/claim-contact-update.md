# Claim Edit Form: Penambahan Kontak WhatsApp dan Email

## Ringkasan

Flow claim edit pada halaman `cicero-dashboard/app/claim/edit/page.jsx` kini mencakup dua field kontak baru agar operator dapat memperbarui kanal komunikasi utama:

- **No WhatsApp**
- **Email**

Perubahan ini memastikan data kontak ikut dimuat dari backend, dirender di form, dan dikirim ulang saat proses simpan data claim.

## Detail Perubahan

### 1) State dan render field kontak baru

Pada `EditUserPage` ditambahkan state:

- `whatsapp`
- `email`

Kedua state tersebut kini dirender pada form sebagai input:

- Label **No WhatsApp** dengan `type="tel"` dan sanitasi ringan karakter input.
- Label **Email** dengan `type="email"`.

### 2) Mapping fallback saat load data user

Di fungsi `loadUser`, nilai kontak diambil menggunakan fallback untuk kompatibilitas variasi key backend:

- WhatsApp: `user.whatsapp` → `user.no_wa` → `user.phone` → `user.telp`
- Email: `user.email` → `user.mail` → `user.email_address`

Dengan pendekatan ini, form tetap dapat menampilkan data kontak meskipun backend mengirim nama properti yang berbeda.

### 3) Segmen informasi baru di atas input kontak

Ditambahkan card informasi sebelum input kontak dengan teks persis:

> **silahkan isi / perbaiki no whatsapp dan email agar kami dapat lebih mudah mengirimkan informasi terbaru kepada anda.**

### 4) Payload update claim diperluas

Saat submit (`handleSubmit`), payload `updateUserViaClaim` kini menyertakan:

- `whatsapp`
- `email`

Nilai dikirim dalam bentuk hasil `trim()` agar konsisten dengan field profil lainnya.

### 5) Update tipe API utility

Di `cicero-dashboard/utils/api.ts`, parameter fungsi `updateUserViaClaim` diperbarui dengan properti opsional:

- `whatsapp?: string`
- `email?: string`

Body request tetap meneruskan seluruh objek `data` ke endpoint `/api/claim/update`.

## Dampak

- Pengguna claim bisa memperbarui data kontak langsung dari halaman edit claim.
- Backend menerima data kontak terbaru pada request update.
- Frontend lebih robust terhadap variasi struktur response backend untuk field kontak.
