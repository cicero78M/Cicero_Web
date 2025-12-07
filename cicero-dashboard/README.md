This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Workspace note

The repository includes multiple package managers, so lockfiles from the monorepo (e.g., `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) should be left untouched when building from this dashboard package. Next.js is configured with `outputFileTracingRoot` set to the repository root (`path.join(__dirname)` in `next.config.ts`), so builds must be run from this `cicero-dashboard` directory to ensure tracing resolves modules from the correct project instead of a parent workspace.

### Dependency note

The dashboard pins `react-d3-cloud` to version `1.0.6`, which is compatible with React 18. If you see a peer dependency conflict mentioning `react-d3-cloud@0.6.0`, clear any old lockfiles or `node_modules` from earlier installs and run `npm install` again from the `cicero-dashboard` directory.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Alur klaim & validasi email

Klaim data pengguna dilakukan melalui halaman `app/claim/page.jsx` dengan langkah berikut:

1. Pengguna memasukkan **NRP** dan **email** lalu menekan tombol **Kirim Kode OTP**.
2. Frontend memanggil fungsi `checkClaimEmailStatus` (`utils/api.ts`) yang menembak endpoint `POST /api/claim/validate-email` untuk memastikan alamat email dapat menerima pesan.
3. Hanya status **`deliverable`** yang diperbolehkan melanjutkan permintaan OTP. Jika status lain diterima, proses dihentikan dan pesan berikut ditampilkan kepada pengguna:
   - `inactive`: email tidak aktif atau sudah tidak bisa menerima pesan.
   - `domain_not_found`: domain email salah/ tidak ditemukan.
   - `mailbox_full`: kotak masuk penuh sehingga OTP tidak bisa dikirim.
   - Status tak dikenal: pengguna diminta memeriksa kembali alamat email atau mencoba lagi.
4. Jika validasi berhasil, aplikasi memanggil `requestClaimOtp` untuk mengirim kode verifikasi dan menyimpan NRP/email di `sessionStorage` sebelum mengarahkan ke halaman OTP.

### Penanganan pesan error di halaman klaim

- Ketika backend mengembalikan respons error (misalnya kombinasi NRP/email tidak cocok atau permintaan OTP ditolak), pesan dari backend diteruskan apa adanya ke pengguna agar lebih mudah dipahami.
- Kesalahan jaringan atau respons tanpa pesan akan menampilkan fallback berbahasa Indonesia seperti "Gagal terhubung ke server" atau "Gagal mengirim OTP".

Catatan untuk pengembang:

- Endpoint `POST /api/claim/validate-email` diharapkan mengembalikan `status` (`deliverable`, `inactive`, `domain_not_found`, `mailbox_full`, dll), `success`, dan `message` opsional.
- Jika endpoint gagal dihubungi atau mengembalikan error, pengguna akan melihat pesan fallback “Validasi email gagal…”.

## Prioritas urutan personel pada rekap engagement

Untuk memastikan pejabat tertentu selalu tampil teratas pada halaman rekap engagement, utilitas `prioritizeUsersForClient` (`utils/userOrdering.ts`) akan memindahkan nama dalam daftar prioritas—seperti **DADANG WIDYO PRABOWO,S.I.K**—ke urutan pertama ketika data rekap dimuat. Perubahan ini berlaku lintas halaman rekap likes Instagram dan komentar TikTok sehingga nama prioritas langsung terlihat tanpa harus menggulir daftar.

## Header laporan rekap likes Instagram

Teks laporan yang disalin dari tombol **Salin Teks Rekap** pada halaman `/likes/instagram/rekap` kini menyesuaikan nama direktorat pengguna. Header akan menampilkan nama client dengan tipe **Direktorat** yang sesuai dengan peran pengguna (misalnya "Ditbinmas"), dan akan kembali ke fallback "Ditbinmas" jika nama tidak tersedia. Dengan demikian, laporan siap kirim WhatsApp langsung menggunakan identitas instansi yang tepat tanpa perlu penyuntingan manual.
