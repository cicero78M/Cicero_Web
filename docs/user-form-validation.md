# Validasi Form Direktori Pengguna

Fungsi `validateNewUser` (`cicero-dashboard/utils/validateUserForm.ts`) membersihkan input NRP/NIP, memverifikasi pangkat, serta memastikan pilihan satfung/divisi sesuai daftar yang ditampilkan di form User Directory. Label dropdown pada klien direktorat juga menampilkan istilah "Satfung/Divisi" agar konsisten dengan judul kolom di tabel. Jika satfung "POLSEK" dipilih, nama polsek wajib diisi dan akan digabung sebagai "POLSEK <Nama>" sebelum dikirim ke API. Opsi pangkat `PHL` ditempatkan di bagian paling bawah dropdown dan tetap harus lolos validasi.

## Daftar pangkat yang valid

Validasi menerima seluruh opsi pangkat pada form User Directory. `PHL` disediakan sebagai pilihan terpisah di bagian paling bawah agar mudah ditemukan:

- BHARADA
- BHARATU
- BHARAKA
- BRIPDA
- BRIPTU
- BRIGADIR
- BRIPKA
- AIPDA
- AIPTU
- IPDA
- IPTU
- AKP
- KOMPOL
- AKBP
- KOMISARIS BESAR POLISI
- JURU MUDA
- JURU MUDA TINGKAT I
- JURU
- JURU TINGKAT I
- PENGATUR MUDA
- PENGATUR MUDA TINGKAT I
- PENGATUR
- PENGATUR TINGKAT I
- PENATA MUDA
- PENATA MUDA TINGKAT I
- PENATA
- PENATA TINGKAT I
- PEMBINA
- PEMBINA TINGKAT I
- PEMBINA UTAMA MUDA
- PEMBINA UTAMA MADYA
- PEMBINA UTAMA
- PPPK
- PHL

## Daftar satfung/divisi yang valid

Validasi menerima seluruh opsi yang muncul di form, termasuk entri Dit Humas, Ditbinmas, serta penambahan Dit Samapta berikut:

- SUBBID MULTIMEDIA
- SUBBID PID
- SUBBID PENMAS
- SUB BAG RENMIN
- BAG LOG
- BAG SDM
- BAG REN
- BAG OPS
- SAT SAMAPTA
- SAT RESKRIM
- SAT INTEL
- SAT NARKOBA
- SAT BINMAS
- SAT LANTAS
- SI UM
- SI TIK
- SI WAS
- SI PROPAM
- SI DOKES
- SPKT
- SAT TAHTI
- DITBINMAS
- SUBBAGRENMIN
- BAGBINOPSNAL
- SUBDIT BINPOLMAS
- SUBDIT SATPAMPOLSUS
- SUBDIT BHABINKAMTIBMAS
- SUBDIT BINTIBSOS
- POLSEK (dengan nama polsek)
- SUBDIT DALMAS
- SUBDIT GASUM
- SUBDIT 1
- SUBDIT 2
- SUBDIT 3
- SUBDIT 4
- BAG RENMIN
- BAG ANALIS
- SIE INTELTEK
- SIE YANMIN
- SIE SANDI

Tambahkan entri baru ke array `SATFUNG_OPTIONS` jika form menampilkan satfung tambahan agar proses penyimpanan pengguna tetap sinkron.
