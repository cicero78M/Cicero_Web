import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileWarning,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Panduan & SOP | Cicero",
  description:
    "Panduan operasional, keamanan, verifikasi data, dan penanganan kendala Sistem Cicero.",
};

const quickLinks = [
  { href: "#mulai", label: "Mulai menggunakan", icon: KeyRound },
  { href: "#seluruh-level", label: "Peran seluruh level", icon: Users },
  { href: "#operasional", label: "SOP operasional", icon: ClipboardCheck },
  { href: "#membaca-data", label: "Membaca data", icon: BarChart3 },
  { href: "#kendala", label: "Penanganan kendala", icon: LifeBuoy },
];

const levelGuidance = [
  { level: "Admin pusat / pengelola sistem", focus: "Menjaga konfigurasi, data master, akses, dan kesiapan layanan.", steps: ["Pastikan client, role, platform, dan username terdaftar sesuai kewenangan.", "Uji login dan menu setelah perubahan akses; catat setiap perubahan produksi.", "Pantau kesehatan sinkronisasi dan tindak lanjuti error lintas satuan.", "Dokumentasikan konfigurasi, waktu kejadian, dan hasil verifikasi."] },
  { level: "Ditbinmas / pengawas wilayah", focus: "Menetapkan sasaran, memantau lintas satuan, dan mengambil keputusan dari rekap tervalidasi.", steps: ["Tetapkan konten target, periode, batas waktu, dan satuan yang dipantau.", "Gunakan lingkup sesuai kewenangan; bedakan ringkasan wilayah dari detail client.", "Tinjau anomali dan status kurang/belum sebelum meminta klarifikasi.", "Sertakan periode, waktu data, dan sumber rekap pada tindak lanjut."] },
  { level: "Operator / pengelola satuan", focus: "Menyiapkan data, membantu personel, memvalidasi status, dan menyusun laporan satuan.", steps: ["Periksa NRP/NIP, username, konten, periode, dan target sebelum tugas dimulai.", "Berikan instruksi yang menyebut platform, tautan konten, periode, dan batas waktu.", "Pantau periode yang sama dan refresh setelah sinkronisasi wajar.", "Pisahkan kendala data/username dari personel yang memang belum melaksanakan."] },
  { level: "Personel / pelaksana", focus: "Melaksanakan aktivitas pada konten yang tepat dan menjaga profil tetap dapat diverifikasi.", steps: ["Pastikan satuan dan profil yang tampil sudah benar sebelum bekerja.", "Buka tautan konten target, lakukan aktivitas sesuai instruksi, lalu pastikan berhasil.", "Perbarui profil melalui portal claim bila username berubah.", "Laporkan kendala dengan waktu, tautan, dan screenshot tanpa kredensial."] },
];

const dailySteps = [
  {
    title: "Pastikan konteks",
    text: "Periksa nama pengguna, client/satuan, periode, dan filter aktif sebelum membaca angka.",
  },
  {
    title: "Validasi personel",
    text: "Gunakan User Directory dan User Insight untuk menemukan profil, username, atau data organisasi yang belum lengkap.",
  },
  {
    title: "Pantau tugas",
    text: "Buka insight Instagram, TikTok, atau Diseminasi yang tersedia pada akun Anda dan pilih konten tugas yang benar.",
  },
  {
    title: "Tindak lanjuti",
    text: "Prioritaskan status Belum dan Kurang Lengkap. Pastikan personel menggunakan akun yang terdaftar.",
  },
  {
    title: "Verifikasi ulang",
    text: "Tunggu proses sinkronisasi, muat ulang data, lalu pastikan periode dan konten tetap sama sebelum menyusun rekap.",
  },
  {
    title: "Laporkan",
    text: "Gunakan data yang sudah tervalidasi. Cantumkan waktu pengambilan dan filter pada laporan atau tangkapan layar.",
  },
];

const troubleshooting = [
  {
    title: "Menu tidak terlihat",
    text: "Menu mengikuti role, jenis client, status fitur, dan paket akses. Keluar lalu masuk kembali setelah akses diubah. Jika tetap tidak ada, minta admin memeriksa profil client—jangan meminjam akun lain.",
  },
  {
    title: "Angka kosong atau nol",
    text: "Nol berarti tidak ada aktivitas yang tercatat pada konteks terpilih; tanda kosong dapat berarti data belum tersedia. Periksa periode, filter, username, status akun publik, dan waktu sinkronisasi sebelum menyimpulkan.",
  },
  {
    title: "Thumbnail atau views belum tampil",
    text: "Data media berasal dari platform eksternal dan dapat terlambat atau dibatasi. Buka tautan konten untuk memverifikasi posting, lalu muat ulang setelah sinkronisasi. Laporkan bila URL valid tetapi masalah berulang.",
  },
  {
    title: "Sesi berakhir / akses ditolak",
    text: "Masuk kembali melalui halaman login. Jika akses tetap ditolak, pastikan akun dan client benar. Jangan mengirim token, cookie, atau kata sandi saat meminta bantuan.",
  },
  {
    title: "Akun sosial diduga dibatasi",
    text: "Verifikasi langsung di aplikasi resmi, cek status akun dan pedoman komunitas, hentikan aktivitas tidak wajar, serta putuskan aplikasi pihak ketiga yang tidak resmi. Jangan langsung mengganti akun tanpa validasi dan pembaruan data Cicero.",
  },
  {
    title: "Ekspor atau laporan berbeda",
    text: "Samakan periode, client, unit, konten, dan filter status. Catat waktu pengambilan karena data platform dapat berubah setelah sinkronisasi berikutnya.",
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}

export default function PanduanSOPPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <section className="border-b border-slate-200 bg-gradient-to-br from-sky-950 via-slate-900 to-emerald-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Pusat panduan operasional
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">Panduan &amp; SOP Sistem Cicero</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              Acuan singkat untuk mengoperasikan dashboard, memvalidasi data, menjaga keamanan akun, dan menangani kendala sebelum eskalasi.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Clock3 className="h-4 w-4" aria-hidden="true" /> Diperbarui 11 September 2026
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Berlaku untuk pengguna dashboard
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Navigasi cepat panduan" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
              <span className="rounded-xl bg-sky-50 p-2 text-sky-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span>{label}</span>
              <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </a>
          ))}
        </nav>

        <section id="mulai" className="scroll-mt-24 py-14" aria-labelledby="mulai-title">
          <SectionHeading eyebrow="01 · Akses" title="Mulai dengan akun dan konteks yang benar" description="Dashboard hanya menampilkan fitur yang diaktifkan untuk role dan client Anda. Tampilan antar pengguna dapat berbeda dan itu bukan selalu kesalahan sistem." />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3"><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><KeyRound className="h-6 w-6" aria-hidden="true" /></span><h3 id="mulai-title" className="text-xl font-bold text-slate-950">Login dashboard</h3></div>
              <ol className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
                <li><strong>1.</strong> Buka <Link href="/login" className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4">halaman login Cicero</Link> dan gunakan kredensial resmi.</li>
                <li><strong>2.</strong> Setelah masuk, cocokkan identitas, satuan/client, dan menu yang tersedia.</li>
                <li><strong>3.</strong> Jika lupa kata sandi, gunakan alur <Link href="/reset-password" className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4">reset password</Link>. Jangan meminta atau membagikan kata sandi melalui grup chat.</li>
                <li><strong>4.</strong> Keluar setelah selesai, terutama pada perangkat bersama.</li>
              </ol>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3"><span className="rounded-2xl bg-violet-50 p-3 text-violet-700"><Users className="h-6 w-6" aria-hidden="true" /></span><h3 className="text-xl font-bold text-slate-950">Registrasi &amp; pembaruan profil personel</h3></div>
              <ol className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
                <li><strong>1.</strong> Buka <Link href="https://claim.papiqo.com/claim" className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4">portal claim Cicero</Link> untuk registrasi NRP/NIP atau login claim.</li>
                <li><strong>2.</strong> Gunakan kata sandi unik dan kuat; jangan memakai contoh dari dokumen atau kata sandi akun lain.</li>
                <li><strong>3.</strong> Tinjau nama, pangkat, jabatan, satuan, kontak, serta username Instagram/TikTok. Masukkan username sesuai format kolom, bukan asumsi.</li>
                <li><strong>4.</strong> Simpan perubahan dan tunggu konfirmasi berhasil. Perubahan dapat memerlukan waktu sebelum terlihat pada seluruh laporan.</li>
              </ol>
            </article>
          </div>
        </section>

        <section id="seluruh-level" className="scroll-mt-24 border-y border-slate-200 py-14" aria-labelledby="level-title">
          <SectionHeading eyebrow="02 · Seluruh level" title="Tata cara penggunaan sesuai tanggung jawab" description="Gunakan pembagian berikut agar satu data tidak diperiksa berulang tanpa koordinasi dan setiap status memiliki penanggung jawab yang jelas." />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {levelGuidance.map((item) => (
              <article key={item.level} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-lg font-bold text-slate-950">{item.level}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.focus}</p>
                <ol className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                  {item.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">{index + 1}</span><span>{step}</span></li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section id="operasional" className="scroll-mt-24 border-y border-slate-200 py-14" aria-labelledby="operasional-title">
          <SectionHeading eyebrow="02 · Prosedur harian" title="SOP operator: cek, pantau, verifikasi, laporkan" description="Gunakan urutan ini agar angka yang dilaporkan dapat ditelusuri dan tidak tercampur antar periode atau konten." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dailySteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-700 text-sm font-bold text-white">{index + 1}</span><h3 className="font-bold text-slate-950">{step.title}</h3></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p><strong>Batas waktu dan jadwal pengingat mengikuti arahan tugas yang berlaku.</strong> Jangan mengasumsikan jam atau interval sinkronisasi tertentu. Selalu tulis waktu pengambilan data pada rekap.</p></div>
          </div>
        </section>

        <section id="membaca-data" className="scroll-mt-24 py-14" aria-labelledby="data-title">
          <SectionHeading eyebrow="03 · Interpretasi" title="Baca status data sebelum mengambil keputusan" description="Metrik Cicero dapat berasal dari profil internal dan platform eksternal. Keduanya memiliki waktu pembaruan dan batas akses yang berbeda." />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {[
              [CheckCircle2, "Sudah", "Aktivitas terdeteksi untuk konten, akun, dan periode yang dipilih. Tetap cocokkan konteks sebelum melaporkan."],
              [FileWarning, "Kurang lengkap / belum", "Sebagian aktivitas belum terdeteksi atau belum dilakukan. Verifikasi akun terdaftar dan konten tugas sebelum tindak lanjut."],
              [RefreshCw, "Kosong / masih diproses", "Jangan otomatis mengartikan sebagai nol. Periksa loading, filter, sumber data, dan sinkronisasi; coba muat ulang secara wajar."],
            ].map(([Icon, title, text]) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-sky-700" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
            <div className="flex items-start gap-4"><ListChecks className="mt-1 h-7 w-7 shrink-0 text-emerald-300" aria-hidden="true" /><div><h3 id="data-title" className="text-xl font-bold">Checklist sebelum mengirim laporan</h3><ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-200 sm:grid-cols-2"><li>✓ Client/satuan dan periode sudah benar</li><li>✓ Konten/link tugas sudah cocok</li><li>✓ Filter status disebutkan</li><li>✓ Data sudah selesai dimuat</li><li>✓ Waktu pengambilan dicantumkan</li><li>✓ Data sensitif disamarkan</li></ul></div></div>
          </div>
        </section>

        <section id="kendala" className="scroll-mt-24 border-t border-slate-200 py-14" aria-labelledby="kendala-title">
          <SectionHeading eyebrow="04 · Troubleshooting" title="Tangani kendala dari penyebab paling umum" description="Lakukan pemeriksaan mandiri berikut. Jika masalah berulang, kirim bukti yang cukup agar tim support dapat menelusurinya." />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {troubleshooting.map((item) => (
              <details key={item.title} className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:border-sky-300">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 [&::-webkit-details-marker]:hidden">
                  <CircleHelp className="h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" /><span>{item.title}</span><span className="ml-auto text-xl font-normal text-slate-400 group-open:rotate-45">+</span>
                </summary>
                <p className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">{item.text}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-6 pb-14 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Keamanan dan eskalasi">
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex items-center gap-3"><LockKeyhole className="h-7 w-7 text-emerald-800" aria-hidden="true" /><h2 className="text-xl font-bold text-emerald-950">Keamanan wajib</h2></div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-emerald-950">
              <li>• Jangan kirim kata sandi, token, cookie, kode reset, atau tangkapan layar yang memuat kredensial.</li>
              <li>• Gunakan alamat resmi <strong>papiqo.com</strong>; periksa kembali domain sebelum login.</li>
              <li>• Jangan gunakan bot, ekstensi, atau aplikasi pihak ketiga yang tidak disetujui untuk aktivitas media sosial.</li>
              <li>• Laporkan sesi atau perubahan profil yang tidak dikenali dan segera reset kata sandi.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><Smartphone className="h-7 w-7 text-sky-700" aria-hidden="true" /><h2 className="text-xl font-bold text-slate-950">Eskalasi ke support</h2></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">Sertakan waktu kejadian (WIB), halaman, client/satuan, periode, filter, langkah yang sudah dicoba, dan screenshot tanpa data rahasia.</p>
            <a href="mailto:cicero@papiqo.com" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">cicero@papiqo.com <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
          </article>
        </section>

        <footer className="flex flex-col gap-4 border-t border-slate-200 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Panduan ini melengkapi kebijakan dan arahan operasional yang berlaku.</p>
          <div className="flex flex-wrap gap-4"><Link href="/mekanisme-absensi" className="font-semibold text-sky-700 hover:underline">Mekanisme Absensi</Link><Link href="/privacy-policy" className="font-semibold text-sky-700 hover:underline">Kebijakan Privasi</Link><Link href="/terms-of-service" className="font-semibold text-sky-700 hover:underline">Ketentuan Layanan</Link></div>
        </footer>
      </div>
    </main>
  );
}
