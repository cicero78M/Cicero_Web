<!--
Sync Impact Report
Version change: unversioned template -> 1.0.0
Modified principles:
- Template principle slot 1 -> I. Existing-System First Refactoring
- Template principle slot 2 -> II. Modular Feature Boundaries
- Template principle slot 3 -> III. UX Clarity Is a Deliverable
- Template principle slot 4 -> IV. Security and Access Control by Default
- Template principle slot 5 -> V. Testable, Observable, Documented Change Units
Added sections:
- Engineering Constraints & Security Baseline
- Delivery Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ updated .specify/templates/plan-template.md
- ✅ updated .specify/templates/spec-template.md
- ✅ updated .specify/templates/tasks-template.md
- ⚪ not present .specify/templates/commands/
- ✅ updated README.md
Follow-up TODOs:
- None
-->
# Cicero Web Constitution

## Core Principles

### I. Existing-System First Refactoring
Perubahan pada `backend/` dan `cicero-dashboard/` MUST dimulai dari sistem yang
sudah berjalan, bukan dari rewrite besar yang memutus perilaku existing tanpa
migration plan. Setiap spec dan plan MUST menjelaskan area yang disentuh,
perilaku yang dipertahankan, risiko regresi, dan strategi rollout/rollback
ketika perubahan menyentuh auth, dashboard utama, insight, atau shared data
flows. Rationale: proyek ini sudah running; nilai tertinggi datang dari
refactor bertahap yang memperbaiki struktur tanpa menghentikan operasi.

### II. Modular Feature Boundaries
Setiap fitur atau halaman baru MUST ditempatkan di batas modul yang jelas:
route/page, UI components, hooks/state, API utilities, dan shared types/helpers
tidak boleh bercampur tanpa alasan yang kuat. Shared logic MUST dipindahkan ke
modul reusable bila dipakai lintas halaman, sedangkan kebutuhan yang spesifik
fitur SHOULD tetap lokal agar dependency graph tetap sederhana. Plan dan tasks
MUST menyebut direktori target yang konkret agar penambahan fitur, halaman, dan
perbaikan bug tetap mudah dikelola. Rationale: maintainability meningkat saat
struktur kode mengikuti domain dan tanggung jawab, bukan pertumbuhan historis.

### III. UX Clarity Is a Deliverable
Setiap perubahan user-facing MUST mendefinisikan alur pengguna, empty/loading/
error/success states, responsivitas desktop-mobile, dan dampaknya terhadap
aksesibilitas dasar sebelum implementasi dimulai. UI refresh MUST meningkatkan
kejelasan tindakan, hierarki informasi, dan konsistensi komponen; perubahan
visual tanpa perbaikan usability yang jelas dianggap belum selesai. Rationale:
tujuan proyek ini bukan sekadar menambah halaman, tetapi membuat sistem lebih
mudah dipakai dan dikembangkan dengan pola UX yang konsisten.

### IV. Security and Access Control by Default
Semua perubahan MUST mempertahankan atau meningkatkan posture keamanan.
Autentikasi, otorisasi berbasis role/client, validasi input, penanganan error,
dan perlindungan secret/env MUST diperiksa untuk setiap fitur yang membaca,
menulis, atau menampilkan data pengguna atau insight operasional. Akses tidak
boleh hanya disembunyikan di UI; batasan MUST divalidasi pada layer data/API
yang relevan dan kegagalan MUST fail closed. Rationale: kemudahan pengembangan
tidak boleh membuka celah pada alur yang bersifat operasional dan sensitif.

### V. Testable, Observable, Documented Change Units
Setiap unit perubahan MUST dapat diverifikasi secara mandiri. Fitur berisiko
sedang/tinggi, perubahan pada auth/shared hooks/utils, dan perbaikan regresi
MUST memiliki automated test atau justifikasi eksplisit mengapa manual
verification yang terstruktur cukup. Semua perubahan MUST menyebut cara
verifikasi, area regresi yang perlu dicek, dan update dokumentasi bila alur
developer/operator berubah. Rationale: restrukturisasi hanya bernilai bila
perubahannya dapat dibuktikan aman, dipahami ulang, dan dilanjutkan oleh tim.

## Engineering Constraints & Security Baseline

- Arsitektur default repo adalah existing monorepo ringan dengan `backend/`
  dan `cicero-dashboard/`; perubahan struktur besar MUST dijustifikasi di plan.
- Frontend MUST menjaga pemisahan concern antara route UI (`app/`), shared
  components (`components/`), state/auth (`context/`, `hooks/`), dan utilitas
  akses data (`utils/`, `lib/`, `types/`) sesuai kebutuhan fitur.
- Semua fitur baru MUST mendeklarasikan dependensi pada endpoint, env vars,
  role/permission, dan fallback/error behavior sebelum coding.
- Secret, token, credential file, dan endpoint sensitif MUST tetap di luar
  source control; konfigurasi publik seperti `NEXT_PUBLIC_API_URL` MUST divalidasi
  secara eksplisit dan tidak boleh diam-diam fallback ke perilaku yang ambigu.
- Perubahan yang memengaruhi query/data fetching SHOULD mempertimbangkan loading
  cost, retry/error handling, dan dampaknya pada dashboard yang dipakai harian.

## Delivery Workflow & Quality Gates

1. Spec MUST mendefinisikan user story independen, impacted modules, kebutuhan
   UX, serta security considerations sebelum plan dibuat.
2. Plan MUST lolos Constitution Check yang menilai strategi refactor existing
   system, modular boundaries, UX states, security controls, dan verification
   approach.
3. Tasks MUST dipisah per user story dan mencantumkan pekerjaan arsitektur,
   implementasi, UX polish, security, verification, dan dokumentasi bila relevan.
4. Implementasi MUST dilakukan secara incremental; rewrite lintas modul tanpa
   checkpoint verifikasi dilarang kecuali sudah dijustifikasi pada plan.
5. Review/completion MUST mencatat hasil verifikasi nyata, residual risk, dan
   follow-up yang belum ditangani.

## Governance

Konstitusi ini menjadi sumber aturan kerja tertinggi untuk artefak Speckit di
repo ini. Setiap amendment MUST diperbarui di `.specify/memory/constitution.md`
dan setiap template yang terdampak MUST disinkronkan dalam perubahan yang sama.

Versioning policy:
- MAJOR: perubahan prinsip atau governance yang mengubah aturan secara tidak
  kompatibel, termasuk penghapusan prinsip atau redefinisi besar.
- MINOR: penambahan prinsip baru, quality gate baru, atau perluasan material
  pada aturan yang mengubah cara spec/plan/tasks disusun.
- PATCH: klarifikasi, perapihan redaksi, atau sinkronisasi template tanpa
  mengubah arti aturan kerja.

Compliance review expectations:
- Setiap plan MUST menunjukkan bagaimana aturan konstitusi dipenuhi atau, bila
  ada deviasi, mendokumentasikan justifikasi pada Complexity Tracking.
- Setiap implementasi MUST melaporkan verifikasi yang dijalankan, risiko yang
  tersisa, dan update dokumentasi yang dilakukan atau sengaja ditunda.
- README dan dokumentasi operasional SHOULD tetap menunjuk artefak yang menjadi
  sumber kebenaran untuk struktur proyek, deployment, dan workflow.

**Version**: 1.0.0 | **Ratified**: 2026-03-27 | **Last Amended**: 2026-03-27
