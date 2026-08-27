import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  FileCheck2,
  Filter,
  Instagram,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

export const metadata = {
  title: "Mekanisme Sistem Absensi | Cicero",
  description:
    "Mekanisme pencatatan engagement, klasifikasi status, verifikasi, dan rekap absensi Cicero.",
};

const flow = [
  {
    icon: ClipboardCheck,
    title: "Konten tugas ditetapkan",
    text: "Konten Instagram atau TikTok yang menjadi target harus berada pada periode dan lingkup client yang benar.",
  },
  {
    icon: UserRoundCheck,
    title: "Personel melaksanakan",
    text: "Personel berinteraksi menggunakan username yang terdaftar pada profil Cicero dan mengikuti arahan tugas yang berlaku.",
  },
  {
    icon: Database,
    title: "Cicero menyinkronkan",
    text: "Sistem mengambil data yang tersedia dari sumber platform. Pembaruan tidak selalu seketika dan dapat dipengaruhi batas platform.",
  },
  {
    icon: Filter,
    title: "Status diklasifikasikan",
    text: "Jumlah aktivitas dibandingkan dengan jumlah konten target pada konteks yang dipilih: lengkap, sebagian, belum, atau tanpa username.",
  },
  {
    icon: FileCheck2,
    title: "Operator memverifikasi",
    text: "Operator memeriksa periode, satuan, konten, username, dan hasil pemuatan sebelum menindaklanjuti personel.",
  },
  {
    icon: BarChart3,
    title: "Rekap digunakan",
    text: "Rekap dapat disalin atau diunduh dari modul engagement. Waktu pengambilan dan filter wajib dicantumkan.",
  },
];

const roles = [
  {
    name: "Personel",
    icon: BadgeCheck,
    duties: [
      "Melaksanakan tugas pada konten yang benar dengan akun terdaftar.",
      "Memastikan aktivitas benar-benar berhasil di aplikasi resmi.",
      "Memperbarui profil melalui portal claim bila username berubah.",
      "Melaporkan kendala kepada operator tanpa membagikan kredensial.",
    ],
  },
  {
    name: "Operator / pengelola satuan",
    icon: UsersRound,
    duties: [
      "Memastikan daftar personel dan username lengkap sebelum pemantauan.",
      "Mendistribusikan konten serta batas waktu sesuai arahan resmi.",
      "Memilih periode, client, dan filter yang tepat pada insight.",
      "Memverifikasi status sebelum mengirim pengingat atau laporan.",
    ],
  },
  {
    name: "Direktorat / pengawas",
    icon: ShieldCheck,
    duties: [
      "Menetapkan lingkup tugas dan target operasional.",
      "Meninjau rekap lintas satuan sesuai kewenangan akun.",
      "Menggunakan Executive Summary atau Anev jika fitur tersedia.",
      "Menindaklanjuti hasil tervalidasi, bukan data yang masih dimuat.",
    ],
  },
  {
    name: "Sistem Cicero",
    icon: RefreshCw,
    duties: [
      "Menggabungkan profil personel, konten target, dan aktivitas platform.",
      "Menghitung status berdasarkan jumlah target pada periode terpilih.",
      "Menyediakan insight, pencarian, filter, salin rekap, dan unduhan.",
      "Memisahkan personel tanpa username dari status pelaksanaan.",
    ],
  },
];

const statuses = [
  {
    label: "Sudah / lengkap",
    color: "emerald",
    text: "Aktivitas terdeteksi pada seluruh konten target dalam konteks yang dipilih.",
  },
  {
    label: "Kurang lengkap",
    color: "amber",
    text: "Sebagian aktivitas terdeteksi, tetapi jumlahnya masih di bawah total konten target.",
  },
  {
    label: "Belum",
    color: "rose",
    text: "Belum ada aktivitas yang terdeteksi pada konten target untuk periode terpilih.",
  },
  {
    label: "Belum update username",
    color: "slate",
    text: "Profil belum memiliki username platform. Status ini dipisahkan dari penilaian aktivitas.",
  },
];

const statusStyles = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  rose: "border-rose-200 bg-rose-50 text-rose-950",
  slate: "border-slate-200 bg-slate-100 text-slate-900",
};

const verification = [
  "Nama client/satuan sesuai kewenangan akun",
  "Platform dan konten tugas sudah benar",
  "Periode atau rentang tanggal sudah benar",
  "Data selesai dimuat tanpa pesan kesalahan",
  "Jumlah konten target masuk akal",
  "Username personel terisi dan sesuai akun",
  "Filter pencarian/status dicatat",
  "Waktu pengambilan data (WIB) dicantumkan",
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function MekanismeAbsensiPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <section className="border-b border-slate-200 bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Mekanisme operasional
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">Mekanisme Sistem Absensi Cicero</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              Cara Cicero mengubah konten tugas dan aktivitas platform menjadi status engagement yang dapat diverifikasi dan direkap.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" /> Diperbarui 27 Agustus 2026</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><AlertCircle className="h-4 w-4" aria-hidden="true" /> Bukan absensi kehadiran fisik</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-8" aria-labelledby="definition-title">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-sky-700 p-3 text-white"><CheckCircle2 className="h-6 w-6" aria-hidden="true" /></span>
            <div><h2 id="definition-title" className="text-xl font-bold text-slate-950">Apa yang dimaksud “absensi” di Cicero?</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">Absensi adalah klasifikasi pelaksanaan aktivitas digital terhadap konten target—likes Instagram dan komentar TikTok—berdasarkan data yang berhasil dideteksi pada periode serta lingkup terpilih. Status bukan bukti kehadiran fisik dan harus diverifikasi sebelum dijadikan dasar tindak lanjut.</p></div>
          </div>
        </section>

        <section className="py-14" aria-labelledby="flow-title">
          <SectionHeading eyebrow="01 · Alur data" title="Dari konten tugas menjadi rekap" description="Setiap tahap bergantung pada tahap sebelumnya. Kesalahan username, periode, atau konten target akan memengaruhi status akhir." />
          <div className="mt-8 grid gap-3 lg:grid-cols-6">
            {flow.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="contents">
                <article className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between"><span className="rounded-xl bg-sky-50 p-2 text-sky-700"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-xs font-bold text-slate-400">0{index + 1}</span></div>
                  <h3 className="mt-4 font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
                {index < flow.length - 1 ? <ArrowDown className="mx-auto h-5 w-5 text-sky-400 lg:hidden" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 py-14" aria-labelledby="role-title">
          <SectionHeading eyebrow="02 · Tanggung jawab" title="Empat pihak dalam mekanisme absensi" description="Cicero membantu pencatatan dan analisis; validasi operasional tetap menjadi tanggung jawab pengguna sesuai kewenangannya." />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {roles.map(({ name, icon: Icon, duties }) => (
              <article key={name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><span className="rounded-2xl bg-sky-50 p-3 text-sky-700"><Icon className="h-6 w-6" aria-hidden="true" /></span><h3 className="text-lg font-bold text-slate-950">{name}</h3></div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">{duties.map((duty) => <li key={duty} className="flex gap-2"><span className="text-emerald-600">✓</span><span>{duty}</span></li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14" aria-labelledby="status-title">
          <SectionHeading eyebrow="03 · Status" title="Cara status engagement dibentuk" description="Status dihitung per personel dengan membandingkan aktivitas yang terdeteksi terhadap total konten target. Instagram memakai likes; TikTok memakai komentar." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statuses.map((status) => <article key={status.label} className={`rounded-2xl border p-5 ${statusStyles[status.color]}`}><h3 className="font-bold">{status.label}</h3><p className="mt-2 text-sm leading-6 opacity-80">{status.text}</p></article>)}
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Data kosong tidak selalu berarti “Belum”.</strong> Jika halaman masih loading, sumber platform gagal, atau jumlah target belum tersedia, tunggu dan muat ulang sebelum menarik kesimpulan.</div>
        </section>

        <section className="grid gap-6 border-y border-slate-200 py-14 lg:grid-cols-2" aria-label="Modul dan akses">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><Instagram className="h-7 w-7 text-fuchsia-700" aria-hidden="true" /><h2 className="text-xl font-bold text-slate-950">Instagram Engagement Insight</h2></div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Memantau kelengkapan likes terhadap konten Instagram target, menelusuri personel, memfilter status, dan membuat rekap.</p>
            <Link href="/likes/instagram" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Buka insight Instagram</Link>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><MessageCircle className="h-7 w-7 text-sky-700" aria-hidden="true" /><h2 className="text-xl font-bold text-slate-950">TikTok Engagement Insight</h2></div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Memantau kelengkapan komentar terhadap konten TikTok target, menelusuri personel, memfilter status, dan membuat rekap.</p>
            <Link href="/comments/tiktok" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Buka insight TikTok</Link>
          </article>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950 lg:col-span-2"><strong>Akses bersifat dinamis.</strong> Ketersediaan platform, pilihan periode historis, lingkup lintas client, Executive Summary, dan Anev mengikuti role, jenis client, status fitur, serta paket akun. Menu yang berbeda antar pengguna tidak otomatis menandakan gangguan.</div>
        </section>

        <section className="py-14" aria-labelledby="verify-title">
          <SectionHeading eyebrow="04 · Kontrol kualitas" title="Checklist sebelum rekap dikirim" description="Gunakan checklist ini setiap kali membuat laporan agar hasil dapat ditelusuri dan dibandingkan secara adil." />
          <div className="mt-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">{verification.map((item) => <div key={item} className="flex items-start gap-3 rounded-xl bg-white/5 p-3 text-sm text-slate-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" /><span>{item}</span></div>)}</div>
          </div>
        </section>

        <section className="grid gap-6 pb-14 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-rose-950">Jika status terasa tidak sesuai</h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-rose-950"><li><strong>1.</strong> Cocokkan username pada User Directory dengan akun yang digunakan.</li><li><strong>2.</strong> Pastikan konten, platform, client, dan periode tidak berubah.</li><li><strong>3.</strong> Verifikasi aktivitas langsung pada aplikasi resmi.</li><li><strong>4.</strong> Muat ulang setelah sinkronisasi; jangan melakukan refresh berulang tanpa jeda.</li><li><strong>5.</strong> Jika tetap berbeda, laporkan waktu WIB, halaman, filter, dan screenshot tanpa kredensial.</li></ol>
          </article>
          <article className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Dokumentasi terkait</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Panduan keamanan, pembaruan profil, interpretasi data kosong, serta eskalasi kendala tersedia pada halaman Panduan &amp; SOP.</p>
            <Link href="/panduan-sop" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800">Buka Panduan &amp; SOP <BookOpenCheck className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
        </section>
      </div>
    </main>
  );
}
