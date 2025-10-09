import {
  ChevronRight,
  CircleHelp,
  ClipboardList,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Panduan & SOP",
  description: "Dokumentasi panduan operasional dan informasi pendukung untuk pengguna Cicero.",
};

export default function PanduanSOPPage() {
  const sections = [
    {
      title: "Panduan Update Data via Web OTP",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Manfaatkan portal Web OTP Cicero untuk memperbarui profil personil secara mandiri dengan validasi berlapis sebelum data disinkronkan ke dashboard.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Buka <span className="font-semibold text-slate-900">https://papiqo.com/claim</span> dan pilih tombol <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">Masuk dengan OTP</span>.</li>
            <li>Masukkan <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">NRP/NIP</span> serta alamat email aktif, lalu ketuk <span className="font-semibold text-slate-900">Kirim Kode</span>.</li>
            <li>Input kode OTP enam digit yang diterima melalui email resmi Cicero, kemudian tekan <span className="font-semibold text-slate-900">Verifikasi</span>.</li>
            <li>Tinjau ringkasan data saat ini pada panel <span className="font-semibold text-slate-900">Profil Personil</span> dan pilih bidang yang ingin diperbarui (Nama, Pangkat, Satfung, Jabatan, Instagram, TikTok, atau nomor kontak).</li>
            <li>Perbarui informasi dengan format terbaru—cantumkan tautan penuh untuk akun media sosial dan pastikan penulisan pangkat sesuai standar.</li>
            <li>Setelah selesai, klik <span className="font-semibold text-slate-900">Simpan Perubahan</span>; sistem akan menampilkan notifikasi hijau ketika pembaruan berhasil.</li>
            <li>Akhiri dengan menekan <span className="font-semibold text-slate-900">Sinkronkan ke Dashboard</span> untuk memicu re-sync dan memastikan data baru terbaca di modul monitoring.</li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute inset-x-20 bottom-10 h-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(224,242,254,0.5),_rgba(255,255,255,0))] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <div className="badge-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
            <Sparkles className="icon-soft-sky h-4 w-4" /> Panduan Operasional
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Panduan &amp; SOP Sistem Cicero
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600">
            Seluruh prosedur operasional, informasi bot, dan FAQ disusun ulang dengan nuansa pastel yang bersih agar sejalan dengan pengalaman dashboard utama.
          </p>
        </header>

        <section className="grid gap-6">
          {sections.map((section, idx) => (
            <details
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-0 shadow-md transition hover:border-emerald-100"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-lg font-semibold text-slate-800 transition group-open:text-[color:var(--cicero-soft-emerald-ink)]">
                <span>{section.title}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-[color:var(--cicero-soft-sky-ink)] transition group-open:rotate-90 group-open:border-emerald-200 group-open:bg-emerald-50 group-open:text-[color:var(--cicero-soft-emerald-ink)]">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </summary>
              <div className="border-t border-sky-100 bg-sky-50/60 px-6 py-6">
                <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                  {section.content}
                </div>
              </div>
            </details>
          ))}
        </section>

        <section className="mt-14 grid gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-8 shadow-md">
            <div className="absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-emerald-100/60 blur-2xl" />
            <div className="relative flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-emerald-ink)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[color:var(--cicero-soft-emerald-ink)]">
                  <MessageCircle className="icon-soft-emerald h-5 w-5" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Tips Keamanan Web OTP</span>
              </div>
              <p className="text-sm text-slate-600">
                Lindungi proses autentikasi Web OTP Cicero dengan menerapkan kebiasaan aman berikut agar kredensial dashboard tetap terjaga dari penyalahgunaan pihak lain.
              </p>
              <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <li className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <span className="text-lg">🔒</span>
                  <span>
                    Jangan pernah membagikan kode OTP kepada siap pun, termasuk pihak yang mengaku admin. Sistem resmi tidak akan meminta kode OTP secara manual.
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <span className="text-lg">📱</span>
                  <span>
                    Pastikan alamat email terdaftar aktif dan hanya digunakan pada perangkat pribadi untuk meminimalkan risiko duplikasi akses.
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:col-span-2">
                  <span className="text-lg">🛡️</span>
                  <span>
                    Segera laporkan ke tim support jika menerima OTP mencurigakan tanpa melakukan permintaan login. Hubungi <span className="font-semibold text-slate-900">cicero@papiqo.com</span> atau WA <span className="font-semibold text-slate-900">0812-3511-4745</span> untuk penanganan.
                  </span>
                </li>
              </ul>
              <p className="text-sm text-slate-600">
                Terapkan verifikasi OTP hanya melalui laman resmi dashboard dan logout setelah sesi selesai untuk menjaga integritas data organisasi.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-8 shadow-md">
            <div className="absolute -left-12 top-8 h-32 w-32 rounded-full bg-emerald-100/70 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-emerald-ink)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[color:var(--cicero-soft-emerald-ink)]">
                  <ClipboardList className="icon-soft-emerald h-5 w-5" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">SOP Operator Polres – Absensi Likes IG</span>
              </div>
              <article className="space-y-5 text-sm leading-relaxed text-slate-700">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">1) Prasyarat &amp; Setup Awal</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Pastikan direktori pengguna lengkap (Nama, NRP, Satker/Polres, username Instagram, nomor WA).</li>
                    <li>Verifikasi akun Instagram personil dalam status publik.</li>
                    <li>Pantau tugas yang dikirim via grup Ditbinmas minimal setiap 30 menit.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">2) Alur Harian</p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Cek link konten target di WAG Cicero.</li>
                    <li>Broadcast link dan batas waktu pengerjaan (maksimal 21:00) kepada seluruh personil.</li>
                    <li>Monitor progres via menu Instagram Engagement Insight, lakukan pencarian nama Polres dan pantau pembaruan (update tiap 30 menit).</li>
                    <li>Kirim pengingat akhir dan tegur personil yang belum like.</li>
                    <li>Laporkan nilai kepatuhan harian dan generate rekap (Sudah, Kurang Lengkap, Belum, Belum Update Username).</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">3) Monitoring &amp; Tindak Lanjut</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Gunakan filter status untuk identifikasi cepat.</li>
                    <li>Perbaiki username salah/berubah dengan meminta update via WA bot lalu lakukan re-fetch.</li>
                    <li>Instruksikan personil mengatur akun menjadi publik bila terdeteksi privat.</li>
                    <li>Jika link tugas salah atau terhapus, segera perbarui dan umumkan ulang.</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-8 shadow-md">
            <div className="absolute -right-12 top-8 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-emerald-ink)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[color:var(--cicero-soft-emerald-ink)]">
                  <ShieldCheck className="icon-soft-emerald h-5 w-5" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">SOP Pelaksanaan Like &amp; Komentar</span>
              </div>
              <article className="space-y-5 text-sm leading-relaxed text-slate-700">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    SOP Pelaksanaan Like dan Komentar Instagram &amp; TikTok Personil Bhabinkamtibmas
                  </p>
                  <p>
                    SOP ini menjadi pedoman bagi seluruh personil Binmas dan Bhabinkamtibmas dalam melaksanakan engagement digital sesuai arahan Ditbinmas Polda Jatim.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">1. Tujuan</p>
                  <p>Memberikan pedoman pelaksanaan like dan komentar pada konten yang ditentukan.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">2. Ruang Lingkup</p>
                  <p>SOP berlaku bagi seluruh personil Binmas dan Bhabinkamtibmas tingkat Polres dan Polsek dalam implementasi Cicero.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">3. Dasar</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Arahan Dir Binmas Polda Jatim mengenai optimalisasi media sosial.</li>
                    <li>Kebijakan penguatan citra Polri melalui engagement digital.</li>
                    <li>Aturan internal penggunaan akun dinas di media sosial.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">4. Definisi</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li><span className="font-semibold text-slate-900">Like:</span> tanda suka pada konten Instagram dan TikTok.</li>
                    <li><span className="font-semibold text-slate-900">Komentar:</span> respon teks positif pada video TikTok yang ditentukan.</li>
                    <li><span className="font-semibold text-slate-900">Konten Dinas:</span> video TikTok dari akun resmi atau prioritas Ditbinmas.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">5. Tugas dan Tanggung Jawab</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold text-slate-900">Personil Bhabinkamtibmas:</span> lakukan like dan komentar positif tanpa SARA/politis sebelum pukul 21.00 WIB.
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Operator Polres:</span> distribusikan link tugas, pantau pelaksanaan, dan buat anev berdasarkan data WA Group/Dashboard.
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Admin Pusat:</span> unggah konten prioritas, monitor kepatuhan, dan susun evaluasi berkala.
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">6. Ketentuan Akun Sosial Media</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Akun dapat pribadi atau dinas namun wajib publik.</li>
                    <li>Wajib memiliki foto profil, mengikuti dan diikuti akun lain.</li>
                    <li>Jika terkena shadowban (tidak dapat like/komentar), segera ganti akun.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">7. Prosedur Pelaksanaan</p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Penerimaan link konten dari grup WA Ditbinmas dan distribusi ke personil.</li>
                    <li>Personil membuka link konten, melakukan like, serta memberikan komentar positif.</li>
                    <li>Gunakan contoh komentar standar untuk menjaga konsistensi dan sopan santun.</li>
                    <li>Pastikan like dan komentar dilakukan keduanya agar tercatat sistem.</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">8. Larangan</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Dilarang komentar bernuansa politik, SARA, ujaran kebencian, atau promosi pribadi.</li>
                    <li>Dilarang menggunakan akun privat atau melewati batas waktu.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">9. Penutup</p>
                  <p>
                    SOP ini wajib dipatuhi seluruh personil untuk mendukung citra humanis Polri dan kedekatan dengan masyarakat di ruang digital.
                  </p>
                </div>
              </article>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-8 shadow-md">
            <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-sky-ink)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-[color:var(--cicero-soft-sky-ink)]">
                  <CircleHelp className="icon-soft-sky h-5 w-5" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">FAQ: Shadowban Instagram &amp; TikTok</span>
              </div>
              <article className="space-y-5 text-sm leading-relaxed text-slate-700">
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Apa itu Shadowban?</p>
                  <p>
                    Shadowban adalah pembatasan otomatis dari platform Instagram maupun TikTok tanpa notifikasi resmi. Dampaknya konten tidak muncul di halaman rekomendasi, hasil pencarian hashtag, maupun timeline pengguna lain secara normal sehingga jangkauan turun drastis.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Ciri-Ciri Akun Terkena Shadowban</p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Penurunan interaksi tajam (views, likes, komentar).</li>
                    <li>Konten tidak tampil di FYP/TikTok Explore atau halaman publik lain.</li>
                    <li>Tayangan terbatas hanya pada sebagian follower atau tidak muncul sama sekali.</li>
                    <li>Tidak bisa memberikan like/komentar pada konten tertentu.</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Penyebab Umum</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Pelanggaran pedoman komunitas: spam, ujaran kebencian, atau konten sensitif.</li>
                    <li>Aktivitas tidak wajar seperti like, komentar, atau follow berlebihan.</li>
                    <li>Penggunaan konten berhak cipta tanpa izin.</li>
                    <li>Penggunaan aplikasi pihak ketiga/bot ilegal.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Cara Mengatasi</p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Istirahatkan akun dan hentikan aktivitas berlebihan selama beberapa hari.</li>
                    <li>Hapus konten yang berpotensi melanggar pedoman.</li>
                    <li>Putuskan koneksi aplikasi tidak resmi.</li>
                    <li>Bersihkan cache aplikasi atau instal ulang.</li>
                    <li>Fokus pada konten orisinal dan aman.</li>
                    <li>Bangun interaksi natural tanpa spam.</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Catatan Penting</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Shadowban dapat menimpa akun besar maupun kecil.</li>
                    <li>Segera siapkan akun cadangan dan daftarkan juga ke sistem WA bot.</li>
                    <li>Gunakan akun cadangan saat akun utama terkena shadowban untuk menjaga kesinambungan aktivitas.</li>
                    <li>Shadowban biasanya sementara dan akan dibuka oleh platform setelah masa penalti berakhir.</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}

