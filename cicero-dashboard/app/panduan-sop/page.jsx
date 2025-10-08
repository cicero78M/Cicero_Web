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
      title: "Panduan Registrasi User Dashboard",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Panduan ini menjelaskan langkah-langkah registrasi dan pembaruan data personil melalui bot WhatsApp Cicero agar akun terhubung ke dashboard.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Simpan nomor bot terbaru ke kontak Anda dan kirim pesan sapaan (contoh: <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">“Selamat Pagi”</span>).
            </li>
            <li>Bot memeriksa status nomor WhatsApp Anda.</li>
            <li>Jika belum terdaftar, bot meminta NRP/NIP. Balas dengan data sesuai database (contoh: 87020990).</li>
            <li>Bot menampilkan ringkasan data dan meminta konfirmasi.</li>
            <li>Balas <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">“ya”</span> untuk menghubungkan nomor WhatsApp.</li>
            <li>Bot mengirim kembali data personil dan menawarkan proses pembaruan.</li>
            <li>Ketik <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">“ya”</span> untuk lanjut memperbarui data.</li>
            <li>Pilih field yang ingin diperbarui dengan membalas angka opsi (1. Nama, 2. Pangkat, 3. Satfung, 4. Jabatan, 5. Instagram, 6. TikTok, 7. Hapus WhatsApp) atau ketik <span className="font-semibold">batal</span> untuk keluar.</li>
            <li>Pilih opsi <span className="font-semibold text-slate-900">5</span> untuk memasukkan tautan profil Instagram dan kirim link profil (contoh: <span className="font-mono text-xs text-slate-600">https://www.instagram.com/cicero_devs?...</span>).</li>
            <li>Konfirmasi dengan membalas <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">“ya”</span> setelah data ditampilkan.</li>
            <li>Pilih opsi <span className="font-semibold text-slate-900">6</span> untuk mengisi tautan profil TikTok, kirim link profil yang valid, lalu balas <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">“ya”</span> untuk menyimpan.</li>
            <li>Lanjutkan pembaruan data lain yang diperlukan hingga seluruh informasi akurat.</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Panduan Update Data via WA Bot",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Gunakan bot WhatsApp Cicero untuk memastikan data personil selalu mutakhir dan terbaca oleh sistem rekap engagement.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Sapa bot di nomor terbaru untuk memastikan koneksi.</li>
            <li>Pilih opsi pembaruan data sesuai kebutuhan (Nama, Pangkat, Satfung, Jabatan, Instagram, TikTok, atau hapus nomor WA lama).</li>
            <li>Masukkan tautan profil Instagram dan TikTok dalam format lengkap agar sistem dapat memantau engagement.</li>
            <li>Jika akun mengalami shadowban, segera ganti dengan akun cadangan dan perbarui datanya melalui bot.</li>
            <li>Pastikan setiap perubahan dikonfirmasi dengan jawaban <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">“ya”</span> agar tercatat.</li>
            <li>Apabila bot menampilkan data yang salah, ulangi proses pembaruan hingga status data sesuai.</li>
            <li>Gunakan menu re-fetch di dashboard setelah pembaruan untuk memastikan sinkronisasi terbaru.</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Panduan Operator Update, Rekap, dan Absensi",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Operator Polres bertanggung jawab mengawal kepatuhan harian like dan komentar di Instagram serta TikTok melalui dashboard Cicero.
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-[color:var(--cicero-soft-sky-ink)]">Prasyarat &amp; Setup Awal</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Pastikan direktori pengguna terisi lengkap: Nama, NRP, Satker/Polres, username Instagram, dan nomor WhatsApp.</li>
                <li>Pastikan akun Instagram personil bersifat publik.</li>
                <li>Pantau distribusi tugas yang dibagikan melalui grup WhatsApp Ditbinmas setiap 30 menit.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--cicero-soft-sky-ink)]">Alur Harian</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Cek link konten target yang dibagikan di WAG Cicero untuk hari berjalan.</li>
                <li>Broadcast link konten kepada personil beserta batas waktu pengerjaan (maksimal pukul 21.00 WIB).</li>
                <li>Monitor progres melalui menu <span className="font-semibold text-slate-900">Instagram Engagement Insight</span> dengan filter nama Polres.</li>
                <li>Kirim pengingat akhir dan tegur personil yang belum menyelesaikan tugas.</li>
                <li>Laporkan nilai kepatuhan harian dan generate rekap dari dashboard (kategori: Sudah, Kurang Lengkap, Belum, Belum Update Username).</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--cicero-soft-sky-ink)]">Monitoring &amp; Tindak Lanjut</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Gunakan filter status untuk mengidentifikasi progres (Sudah, Kurang Lengkap, Belum, Belum Update Username IG).</li>
                <li>Jika username salah/berubah, instruksikan personil memperbarui via WA bot lalu lakukan re-fetch.</li>
                <li>Jika akun bersifat privat, minta personil mengubah ke publik sebelum batas waktu.</li>
                <li>Perbarui dan sebarkan ulang link tugas jika tautan sebelumnya tidak valid.</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Panduan Penggunaan Chart Visualisasi Data",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Chart pada dashboard dirancang untuk memberikan gambaran cepat terhadap performa engagement setiap satker.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Pilih jenis chart pada menu analitik sesuai kebutuhan pemantauan (likes, komentar, views, atau distribusi personil).</li>
            <li>Gunakan filter periode, satker, dan platform untuk menyesuaikan data yang ingin dievaluasi.</li>
            <li>Sorot titik data untuk melihat detail metrik; gunakan mode fullscreen bila tersedia untuk presentasi.</li>
            <li>Unduh chart sebagai gambar atau data mentah untuk keperluan laporan internal.</li>
            <li>Padukan insight chart dengan rekap harian agar tindak lanjut lebih tepat sasaran.</li>
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
                <MessageCircle className="icon-soft-emerald h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Informasi Wabot Terbaru</span>
              </div>
              <p className="text-sm text-slate-600">
                Sehubungan dengan kendala teknis pada nomor lama, WA Bot Cicero resmi berpindah ke nomor baru berikut. Gunakan nomor ini untuk seluruh akses menu, laporan, dan pelayanan sistem.
              </p>
              <ul className="grid gap-2 text-base font-semibold text-slate-800 sm:grid-cols-2">
                <li className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                  <span className="text-lg">✅</span> 0857-3559-4977
                </li>
                <li className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                  <span className="text-lg">✅</span> 0811-3074-4171
                </li>
              </ul>
              <p className="text-sm text-slate-600">
                Mohon seluruh rekan/anggota segera menggunakan nomor di atas. Terima kasih atas pengertiannya. <span className="font-semibold text-[color:var(--cicero-soft-emerald-ink)]">— Cicero</span>
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-sky-50 p-8 shadow-md">
            <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-sky-ink)]">
                <CircleHelp className="icon-soft-sky h-6 w-6" />
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

          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-8 shadow-md">
            <div className="absolute -right-12 top-8 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-emerald-ink)]">
                <ShieldCheck className="icon-soft-emerald h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">SOP Pelaksanaan Like &amp; Komentar</span>
              </div>
              <article className="space-y-5 text-sm leading-relaxed text-slate-700">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    SOP Pelaksanaan Like dan Komentar Instagram &amp; TikTok Personil Bhabinkamtibmas
                  </p>
                  <p>
                    SOP ini menjadi pedoman bagi seluruh personil Bhabinkamtibmas dalam melaksanakan engagement digital sesuai arahan Ditbinmas Polda Jatim.
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

          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-8 shadow-md">
            <div className="absolute -left-12 top-8 h-32 w-32 rounded-full bg-emerald-100/70 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-[color:var(--cicero-soft-emerald-ink)]">
                <ClipboardList className="icon-soft-emerald h-6 w-6" />
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
        </section>
      </div>
    </main>
  );
}

