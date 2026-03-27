# Feature Specification: Landing Page Relevance Refresh

Feature Branch: 001-landing-page-refresh
Created: 2026-03-27
Status: Draft
Input: update dan improvement landing page agar lebih relevan untuk Cicero saat ini dan lebih menarik

## Clarifications

### Session 2026-03-27
- Q: Untuk landing page publik, jalur mana yang harus menjadi CTA utama? → A: CTA utama adalah konsultasi atau hubungi tim, lalu login dan claim menjadi CTA sekunder.
- Q: Siapa persona utama landing page yang harus diprioritaskan? → A: Calon pengambil keputusan atau koordinator operasional yang sedang mengevaluasi Cicero.
- Q: Bagaimana elemen publik yang belum punya dasar operasional jelas harus ditangani? → A: Hapus atau ganti dengan konten netral sampai ada bukti dan mekanisme yang tervalidasi.

## User Scenarios and Testing

### User Story 1 - Pengunjung memahami nilai Cicero dengan cepat - P1
Pengunjung baru, terutama calon pengambil keputusan atau koordinator operasional yang sedang mengevaluasi Cicero, harus langsung memahami apa yang dikerjakan Cicero saat ini, siapa pengguna utamanya, dan hasil operasional apa yang dibantu tanpa harus membuka dashboard terlebih dahulu.

Why this priority: landing page saat ini masih mencampur narasi produk, akses internal, dan klaim yang belum terbukti sehingga pesan utama produk menjadi kabur.

Independent Test: buka halaman sebagai pengunjung baru dan pastikan dalam satu kali scroll pengguna bisa memahami nilai utama Cicero dan menemukan CTA utama.

Acceptance Scenarios:
1. Given pengunjung membuka halaman dari kondisi belum login, When halaman selesai dimuat, Then hero menjelaskan posisi Cicero secara ringkas, spesifik, dan selaras dengan kapabilitas nyata yang sudah tersedia.
2. Given pengunjung membaca bagian penjelasan produk, When mereka menilai manfaat utama, Then setiap manfaat terhubung ke use case operasional nyata seperti monitoring, insight, rekap, knowledge base, atau alur operasional.
3. Given halaman menampilkan metrik, testimoni, atau klaim hasil, When informasi ditampilkan, Then halaman hanya memakai bukti yang terverifikasi atau fallback netral bila bukti publik belum tersedia.

### User Story 2 - Pengunjung masuk ke jalur aksi yang tepat - P2
Pengunjung harus melihat CTA yang jelas sesuai tujuannya sehingga tidak bingung antara alur publik, login dashboard, claim update profil, panduan SOP, atau kanal kontak.

Why this priority: landing page saat ini menampilkan beberapa akses internal sebagai CTA utama tanpa hirarki yang kuat sehingga funnel dan arah aksi menjadi bingung.

Independent Test: periksa CTA utama dan sekunder pada desktop serta mobile dan pastikan setiap tombol mengarahkan pengguna ke tindakan yang sesuai dengan konteksnya.

Acceptance Scenarios:
1. Given pengunjung belum login, When mereka melihat area CTA utama, Then tindakan utama yang paling menonjol harus mengarahkan ke konsultasi atau kontak tim, sementara login dan claim tampil sebagai CTA sekunder yang tetap mudah ditemukan.
2. Given pengunjung mencari akses operasional tertentu, When mereka memilih login, claim, panduan, atau kontak, Then setiap jalur diberi label yang mudah dipahami dan tidak menyesatkan fungsi tujuannya.
3. Given pengguna sudah memiliki sesi aktif, When mereka membuka landing page publik, Then perilaku redirect ke rute kerja terakhir atau dashboard tetap berjalan.

### User Story 3 - Pengunjung menilai kredibilitas halaman - P3
Landing page harus terasa rapi, kredibel, dan siap dipakai sebagai halaman publik sehingga pemangku kepentingan dapat mempercayai informasi yang disajikan.

Why this priority: halaman yang menarik bukan hanya visual tetapi juga kepercayaan, struktur informasi, legal links, dan state interaksi yang jujur.

Independent Test: tinjau halaman dari atas ke bawah, periksa blok social proof, legal, dan interaksi, lalu pastikan tidak ada elemen yang terlihat selesai padahal tidak memiliki tindak lanjut nyata.

Acceptance Scenarios:
1. Given pengunjung menelusuri seluruh halaman, When mereka melihat blok social proof, legal, atau kontak, Then informasi terasa kredibel, konsisten, dan tidak berasal dari klaim internal yang dibuat buat.
2. Given halaman memuat formulir atau ajakan tindak lanjut, When pengguna berinteraksi, Then sistem menampilkan hasil yang jujur dan jelas bukan sukses semu.
3. Given halaman dibuka di layar sempit, When pengguna menavigasi antar bagian dan CTA, Then hirarki visual dan keterbacaan tetap terjaga.

### Edge Cases
- Bukti publik seperti testimoni, harga, atau metrik belum tervalidasi untuk ditampilkan ke publik.
- CTA untuk pengunjung baru dan jalur akses pengguna internal tampak sama kuatnya dan membingungkan.
- Pengguna sudah login dan membuka slash dengan last pathname yang masih valid.
- Ada formulir atau ajakan kontak yang belum memiliki mekanisme tindak lanjut yang nyata.
- Urutan informasi berubah pada mobile dan membuat CTA utama tenggelam.
- Jika pricing, testimoni, atau formulir langganan belum memiliki dasar operasional yang tervalidasi, elemen tersebut harus dihapus atau diganti dengan konten netral yang tidak menyesatkan.

## Existing System Impact
- Affected Areas: landing page publik di slash, hook redirect autentikasi untuk rute publik, tautan ke slash login, slash login-update, slash claim, slash mekanisme-absensi, slash panduan-sop, slash terms-of-service, dan slash privacy-policy, serta README bila positioning produk berubah.
- Behavior Preserved: pengguna yang sudah login tetap diarahkan ke rute kerja terakhir atau slash dashboard, tautan legal tetap tersedia, dan akses ke login claim dan panduan tetap dapat ditemukan dari halaman publik.
- Migration Rollout: perubahan dilakukan in place pada landing page yang sudah ada tanpa rollout bertahap.
- Regression Risks: redirect sesi aktif, label dan tujuan CTA, pengalaman mobile, state interaksi pada form atau tombol, dan konsistensi pesan publik terhadap kapabilitas produk saat ini.

## Requirements

### Functional Requirements
- FR-001: Sistem must menampilkan narasi landing page yang menggambarkan kapabilitas Cicero saat ini secara akurat, relevan, dan mudah dipahami oleh pengunjung non teknis.
- FR-002: Sistem must memprioritaskan CTA utama untuk konsultasi atau menghubungi tim, lalu menempatkan login dashboard dan claim update profil sebagai CTA sekunder dengan hirarki yang jelas.
- FR-003: Pengguna must dapat menemukan jalur menuju dashboard, claim update profil, panduan operasional, dan kanal kontak tanpa harus menebak fungsi tiap tombol.
- FR-004: Sistem must menyusun bagian konten yang menghubungkan proposisi nilai Cicero dengan use case operasional nyata yang sudah didukung produk saat ini.
- FR-004A: Sistem must memprioritaskan copy, struktur manfaat, dan bukti pendukung untuk kebutuhan calon pengambil keputusan atau koordinator operasional yang sedang mengevaluasi Cicero sebagai solusi kerja.
- FR-005: Sistem must menghindari klaim produk, paket harga, integrasi, atau hasil operasional yang tidak dapat dipertanggungjawabkan pada konteks publik saat ini.
- FR-006: Sistem must menyediakan blok kepercayaan yang menggunakan bukti tervalidasi atau alternatif informasi yang netral bila bukti publik belum tersedia.
- FR-006A: Sistem must menghapus atau mengganti elemen publik yang belum tervalidasi, termasuk pricing statis, testimoni internal, atau formulir tindak lanjut semu, dengan konten netral yang tetap kredibel.
- FR-007: Sistem must mempertahankan perilaku redirect untuk pengguna yang sudah terautentikasi ketika mereka membuka landing page publik.
- FR-008: Sistem must memastikan setiap elemen interaktif pada landing page menghasilkan outcome yang jujur termasuk state sukses gagal atau informasi tindak lanjut yang sesuai.
- FR-009: Sistem must mempertahankan akses ke tautan legal dan referensi kebijakan yang sudah diwajibkan pada aplikasi publik.
- FR-010: Sistem must menjaga agar perubahan landing page tidak mengganggu alur akses ke halaman publik lain yang sudah ada.

### UX Accessibility and Content Requirements
- UX-001: Fitur ini must mendefinisikan alur utama pengunjung baru dari memahami nilai Cicero sampai memilih tindakan berikutnya.
- UX-002: Fitur ini must mendefinisikan state normal hover focus serta hasil sukses atau gagal untuk CTA tautan dan formulir yang dipertahankan.
- UX-003: Fitur ini must tetap nyaman dipakai pada desktop dan mobile dengan urutan informasi yang konsisten dan CTA tetap terlihat jelas.
- UX-004: Fitur ini must menggunakan struktur informasi yang memudahkan pemindaian cepat termasuk headline yang spesifik subheadline yang menjelaskan konteks dan urutan section yang logis.
- UX-005: Fitur ini must mempertahankan atau meningkatkan aksesibilitas dasar melalui heading yang semantik label interaktif yang jelas fokus keyboard yang terlihat dan kontras yang dapat dibaca.
- UX-006: Fitur ini must menghindari pola konten yang menimbulkan ekspektasi palsu seperti form sukses tanpa tindak lanjut nyata atau testimoni yang tidak kredibel.

### Security and Data Protection Requirements
- SEC-001: Fitur ini must mempertahankan batas akses publik versus terautentikasi yang sudah ada termasuk redirect pengguna aktif ke area kerja yang sesuai.
- SEC-002: Fitur ini must memvalidasi input apa pun yang tetap dikumpulkan dari pengunjung dan menjelaskan hasil bila data tidak dapat diproses.
- SEC-003: Fitur ini must tidak menampilkan data operasional sensitif token atau detail internal yang hanya relevan untuk dashboard terautentikasi.
- SEC-004: Tautan menuju area internal must diberi label sesuai tujuan agar pengunjung publik tidak mengira seluruh fitur dapat diakses tanpa autentikasi.

### Key Entities
- Pengunjung Publik: orang yang membuka landing page untuk memahami apa itu Cicero dan menentukan tindakan berikutnya, dengan fokus utama pada calon pengambil keputusan atau koordinator operasional.
- Jalur Aksi: tindakan lanjutan yang tersedia dari landing page seperti login dashboard claim profil membuka panduan operasional atau menghubungi tim.
- Bukti Kredibilitas: konten pendukung yang memperkuat kepercayaan seperti use case nyata referensi proses legal links metrik tervalidasi atau testimoni yang sah.
- Pesan Nilai: ringkasan manfaat utama Cicero yang harus selaras dengan kemampuan produk yang benar benar tersedia saat ini.

## Success Criteria

### Measurable Outcomes
- SC-001: Dalam uji baca cepat pengunjung baru dapat menjelaskan fungsi utama Cicero dan siapa pengguna utamanya dalam waktu 10 detik setelah melihat hero section.
- SC-002: Setidaknya 90 persen peserta uji internal dapat memilih CTA yang benar untuk tujuan mereka pada percobaan pertama tanpa penjelasan tambahan.
- SC-003: Seluruh klaim utama pada landing page lolos review isi dan tidak menyisakan pernyataan yang tidak tervalidasi atau menyesatkan.
- SC-004: Pada verifikasi desktop dan mobile seluruh CTA utama dan tautan penting dapat diakses dibaca dan dijalankan tanpa kehilangan konteks atau tabrakan hirarki visual.
- SC-005: Tidak ada elemen interaktif yang memberikan konfirmasi sukses palsu ketika tindakan sebenarnya belum diproses.

## Verification Strategy
- Automated Checks: lint build dan pengujian UI terarah untuk memastikan render landing page perilaku CTA penting dan redirect autentikasi tetap aman setelah perubahan.
- Manual Checks: tinjau hero urutan section hirarki CTA legal links state form atau aksi serta pengalaman desktop mobile dan pengguna sudah login yang membuka slash.
- Documentation Impact: konfirmasi apakah README atau dokumen orientasi produk perlu diperbarui agar deskripsi publik Cicero konsisten dengan landing page yang baru.

## Assumptions
- Landing page tetap menjadi rute publik utama untuk memperkenalkan Cicero sebelum pengguna masuk ke area dashboard.
- Kapabilitas yang boleh diangkat di halaman publik harus berasal dari fungsi yang memang sudah tersedia atau bisa diverifikasi dari produk dan dokumentasi yang ada saat ini.
- Alur login dashboard claim update profil dan panduan SOP tetap dipertahankan sebagai entry path yang valid tetapi berada di bawah CTA utama konsultasi atau kontak.
- Persona utama yang dioptimalkan adalah evaluator solusi atau koordinator operasional, sedangkan pengguna internal harian tetap dilayani melalui CTA sekunder.
- Jika bukti publik seperti harga, testimoni, atau newsletter capture belum memiliki dasar operasional yang jelas, konten tersebut harus diposisikan ulang, disederhanakan, atau dihapus demi akurasi.
