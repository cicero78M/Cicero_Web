# Validasi Form Direktori Pengguna

Fungsi `validateNewUser` (`cicero-dashboard/utils/validateUserForm.ts`) membersihkan input NRP/NIP, memverifikasi pangkat, serta memastikan pilihan satfung/divisi sesuai daftar yang ditampilkan di form User Directory. Label dropdown pada klien direktorat juga menampilkan istilah "Satfung/Divisi" agar konsisten dengan judul kolom di tabel. Jika satfung "POLSEK" dipilih, nama polsek wajib diisi dan akan digabung sebagai "POLSEK <Nama>" sebelum dikirim ke API.

## Daftar satfung/divisi yang valid

Validasi menerima seluruh opsi yang muncul di form, termasuk entri Dit Humas, Ditbinmas, serta penambahan Dit Samapta berikut (urutannya mengikuti dropdown di form dan nilai terbaru di `SATFUNG_OPTIONS`):

- SUBBID MULTIMEDIA
- SUBBID PENMAS
- SUBBID PID
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
- SUBDIT DALMAS
- SUBDIT GASUM
- UNIT POLSATWA
- POLSEK (dengan nama polsek)

Daftar ini juga mencakup penambahan terbaru `UNIT POLSATWA` agar selaras dengan array `SATFUNG_OPTIONS`. Tambahkan entri baru ke array `SATFUNG_OPTIONS` jika form menampilkan satfung tambahan agar proses penyimpanan pengguna tetap sinkron.
