# Validasi Form Direktori Pengguna

Fungsi `validateNewUser` (`cicero-dashboard/utils/validateUserForm.ts`) membersihkan input NRP/NIP, memverifikasi pangkat, serta memastikan pilihan satfung/divisi sesuai daftar yang ditampilkan di form User Directory. Label dropdown pada klien direktorat juga menampilkan istilah "Satfung/Divisi" agar konsisten dengan judul kolom di tabel. Jika satfung "POLSEK" dipilih, nama polsek wajib diisi dan akan digabung sebagai "POLSEK <Nama>" sebelum dikirim ke API. Daftar pangkat dan satfung yang muncul di form berasal dari konstanta yang sama dengan validasi (`PANGKAT_OPTIONS` dan `SATFUNG_OPTIONS`) sehingga tidak mudah menimbulkan konflik saat menambah opsi baru.

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
- UNIT POLSATWA

Tambahkan entri baru ke array `SATFUNG_OPTIONS` jika form menampilkan satfung tambahan agar proses penyimpanan pengguna tetap sinkron.
