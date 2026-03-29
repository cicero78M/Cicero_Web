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
- `no_wa` (alias kompatibilitas backend lama)
- `email`

Nilai dikirim dalam bentuk hasil `trim()` agar konsisten dengan field profil lainnya.

### 5) Update tipe API utility

Di `cicero-dashboard/utils/api.ts`, parameter fungsi `updateUserViaClaim` diperbarui dengan properti opsional:

- `whatsapp?: string`
- `no_wa?: string`
- `email?: string`

Body request meneruskan payload ke endpoint `/api/claim/update` dengan fallback dua arah:

- jika hanya ada `whatsapp`, frontend otomatis menambahkan `no_wa`
- jika hanya ada `no_wa`, frontend otomatis menambahkan `whatsapp`

Validasi nomor di halaman claim edit juga diselaraskan menjadi minimal **8 digit** agar konsisten dengan kontrak backend.

## Dampak

- Pengguna claim bisa memperbarui data kontak langsung dari halaman edit claim.
- Backend menerima data kontak terbaru pada request update.
- Frontend lebih robust terhadap variasi struktur response backend untuk field kontak.

## Update aturan role untuk field Desa Binaan

Flow claim edit di `cicero-dashboard/app/claim/edit/page.jsx` kini menambahkan guard berbasis role untuk field **Desa Binaan**:

- State baru `role` ditambahkan agar role user tersimpan saat load data claim.
- Pada `loadUser`, role dibaca dengan fallback key: `role` → `user_role` → `userRole`.
- Role dinormalisasi menggunakan `trim().toLowerCase()` lalu dibandingkan ke nilai `ditbinmas`.
- Field **Desa Binaan** hanya dirender jika role ter-normalisasi adalah `ditbinmas`.
- Saat submit, payload `desa` hanya mengirim nilai input untuk role `ditbinmas`; untuk role lain dikirim string kosong (`""`) agar backend tidak memproses data desa yang tidak relevan.

Tujuan bisnis dari aturan ini adalah menjaga agar data desa binaan hanya diisi oleh unit yang memang memiliki konteks operasional terhadap desa binaan, sekaligus mencegah data tidak valid dari role lain.
