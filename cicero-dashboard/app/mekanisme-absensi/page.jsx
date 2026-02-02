import {
  BadgeCheck,
  CalendarCheck,
  FileText,
  Map,
  Network,
  Shield,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const metadata = {
  title: "Mekanisme Sistem Absensi",
  description:
    "Ikhtisar menyeluruh mekanisme absensi harian Cicero: aktor, alur kerja, peran RACI, dan integrasi lintas sistem.",
};

const actors = [
  {
    name: "Tingkat Polda- Direktorat / Bidang",
    icon: Shield,
    focus: "Regulator & pengawas kebijakan",
    responsibilities: [
      "Menetapkan target kepatuhan harian",
      "Upload tugas konten pada akun resmi",
      "Melakukan briefing harian pada WAG Social Media Tingkat Polda- Direktorat / Bidang",
      "Mengirim Laporan Kepatuhan kepada satker jajaran",
      "Memonitor permintaan kolaborasi dan mengkurasi konten dari satker jajaran",
    ],
  },
  {
    name: "Operator Polres",
    icon: UsersRound,
    focus: "Koordinator lapangan",
    responsibilities: [
      "Mengelola data personil - penambahan akun baru, pergantian akun, permintaan penghapusan akun",
      "Monitor tugas di WAG Social Media Tingkat Polda- Direktorat / Bidang dan mendistribusikan link tugas harian",
      "Mengakomodir kendala personil dan melaporkan pada Cicero",
      "Melakukan absensi personil harian",
      "Mengirim permintaan kolaborasi konten ke akun resmi Ditbinmas",
    ],
  },
  {
    name: "Personil",
    icon: BadgeCheck,
    focus: "Pelaksana tugas individu",
    responsibilities: [
      "Melakukan likes dan komentar sesuai tugas harian",
      "Melaporkan kendala kepada operator",
      "Memperbarui data akun pribadi ketika ada perubahan data",
    ],
  },
  {
    name: "Sistem Cicero",
    icon: Network,
    focus: "Otomasi & analytics",
    responsibilities: [
      "Monitoring akun resmi, mengambil data konten hari ini, membuat dan mengirim pesan tugas ke WAG Tingkat Polda- Direktorat / Bidang",
      "Menarik data engagement real-time",
      "Menghasilkan status absensi",
      "Menghitung skor pelaksanaan tugas",
      "Membuat rekap kepatuhan harian, mingguan dan bulanan",
      "Mengirim informasi, laporan dan notifikasi via Wa Bot",  
      "Mendistribusikan laporan harian, mingguan dan Executive Summary / Anev Bulanan",
    ],
  },
];

const steps = [
  {
    title: "Distribusi Tugas Harian",
    detail:
      "Tingkat Polda - Direktorat / Bidang mengunggah konten harian atau menerima permintaan kolaborasi dari satker, selanjutnya sistem Cicero secara otomatis mengirim rrekap link konten tugas ke WAG pusat, dilanjut operator Polres menyalurkan rekap link tugas ke personil / group satkernya dengan instruksi batas waktu.",
  },
  {
    title: "Pelaksanaan Interaksi",
    detail:
      "Personil menjalankan tugas like/komentar sesuai tugas konten. Sistem merekam aktivitas pelaksanaan likes dan komentar.",
  },
  {
    title: "Validasi & Absensi",
    detail:
      "Sistem melakukan fetch data pelaksanaan likes dan komentar, memastikan status melaksanakan /tidak melaksanakan akurat.",
  },
  {
    title: "Eskalasi & Pelaporan",
    detail:
      "Status harian direkap otomatis. Operator mengambil absensi via dashboard, memberi teguran awal kepada personil, selanjutnya Tingkat Polda - Direktorat / Bidang memberikan teguran tindak lanjut bagi satker dengan tingkat kepatuhan rendah.",
  },
];

const raciMatrix = [
  {
    activity: "Penetapan target & SOP",
    r: "Tingkat Polda - Direktorat / Bidang",
    a: "Tingkat Polda - Direktorat / Bidang",
    c: "Operator Polres",
    i: "Personil",
  },
  {
    activity: "Distribusi link & jadwal",
    r: "Operator Polres",
    a: "Tingkat Polda - Direktorat / Bidang",
    c: "Sistem",
    i: "Personil",
  },
  {
    activity: "Eksekusi tugas interaksi",
    r: "Personil",
    a: "Operator Polres",
    c: "Tingkat Polda - Direktorat / Bidang",
    i: "Sistem",
  },
  {
    activity: "Monitoring & rekap absensi",
    r: "Sistem",
    a: "Operator Polres",
    c: "Tingkat Polda - Direktorat / Bidang",
    i: "Personil",
  },
  {
    activity: "Eskalasi ketidakpatuhan",
    r: "Operator Polres",
    a: "Tingkat Polda - Direktorat / Bidang",
    c: "Sistem",
    i: "Personil",
  },
];

const integrations = [
  {
    term: "Re-fetch",
    description: "Pemicu sinkronisasi ulang data engagement pada dashboard untuk memastikan status absensi terbaru.",
    route: "Dashboard → Instagram/TikTok Insight → Tombol Re-fetch",
  },
  {
    term: "Shadowban",
    description: "Kondisi penurunan jangkauan konten yang memerlukan pergantian akun dan update data profil secepatnya.",
    route: "WA Bot → Menu Update Profil → Kirim username baru",
  },
  {
    term: "Auto Recap",
    description: "Job terjadwal yang membuat ringkasan kepatuhan harian di modul Executive Summary.",
    route: "Background Service → Executive Summary → Distribusi PDF",
  },
  {
    term: "Attendance Score",
    description: "Skor gabungan dari kecepatan, kelengkapan, dan konsistensi interaksi personil.",
    route: "Analytics Engine → Dashboard KPI → Notifikasi WA Bot",
  },
];

function RelationshipMap() {
  return (
    <svg
      viewBox="0 0 600 260"
      role="img"
      aria-label="Peta hubungan antar aktor sistem absensi"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(165,243,252,0.8)" />
          <stop offset="100%" stopColor="rgba(196,181,253,0.9)" />
        </linearGradient>
        <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.6)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.5)" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(148,163,184,0.35)" />
        </filter>
      </defs>

      <rect x="0" y="0" width="600" height="260" rx="24" fill="rgba(241,245,249,0.85)" />

      <g stroke="url(#edgeGradient)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M180 70 Q300 30 420 70" />
        <path d="M180 190 Q300 230 420 190" />
        <path d="M150 90 Q120 130 150 170" />
        <path d="M450 90 Q480 130 450 170" />
        <path d="M300 110 Q300 130 300 150" strokeDasharray="8 6" />
      </g>

      <g fill="url(#nodeGradient)" filter="url(#shadow)" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5">
        <rect x="250" y="110" width="100" height="50" rx="14" />
        <rect x="90" y="40" width="120" height="60" rx="18" />
        <rect x="90" y="160" width="120" height="60" rx="18" />
        <rect x="390" y="40" width="120" height="60" rx="18" />
        <rect x="390" y="160" width="120" height="60" rx="18" />
      </g>

      <g
        fill="#1f2937"
        fontFamily="'Inter', 'Helvetica Neue', sans-serif"
        fontSize="15"
        fontWeight="600"
        textAnchor="middle"
      >
        <text x="300" y="140">Sistem Cicero</text>
        <text x="150" y="75">Tingkat Polda - Direktorat / Bidang</text>
        <text x="150" y="195">Operator</text>
        <text x="450" y="75">Analytics</text>
        <text x="450" y="195">Personil</text>
      </g>

      <g
        fill="rgba(100,116,139,0.85)"
        fontFamily="'Inter', 'Helvetica Neue', sans-serif"
        fontSize="11"
        fontWeight="500"
        textAnchor="middle"
      >
        <text x="300" y="157">(Engine)</text>
        <text x="150" y="92">(Regulator)</text>
        <text x="150" y="212">(Koordinator)</text>
        <text x="450" y="92">(Insight Hub)</text>
        <text x="450" y="212">(Pelaksana)</text>
      </g>

      <g
        fill="#0284c7"
        fontFamily="'Inter', 'Helvetica Neue', sans-serif"
        fontSize="11"
        fontWeight="500"
      >
        <text x="300" y="95" textAnchor="middle">Rekap Otomatis</text>
        <text x="300" y="185" textAnchor="middle">Data Absensi</text>
        <text x="104" y="130" textAnchor="start">Kebijakan</text>
        <text x="104" y="150" textAnchor="start">Laporan harian</text>
        <text x="496" y="130" textAnchor="end">Insight Data</text>
        <text x="496" y="150" textAnchor="end">Laporan Kendala</text>
        <text x="300" y="175" textAnchor="middle">Data Engagement</text>
      </g>
    </svg>
  );
}

export default function MekanismeAbsensiPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-100 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute inset-x-20 bottom-10 h-64 rounded-full bg-gradient-to-r from-sky-200/40 via-transparent to-pink-200/40 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700 shadow-lg shadow-sky-200/70">
            <Sparkles className="h-4 w-4 text-sky-500" /> Blueprint Absensi
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Mekanisme Sistem Absensi Cicero
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600">
            Peta utuh yang merangkum aktor kunci, alur kerja, tanggung jawab RACI, serta koneksi integrasi yang menopang kepatuhan harian di lingkungan Tingkat Polda - Direktorat / Bidang.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          {actors.map((actor) => {
            const Icon = actor.icon;
            return (
              <article
                key={actor.name}
                className="group relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-6 shadow-xl shadow-sky-100/70 backdrop-blur-md transition hover:border-sky-300"
              >
                <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-sky-700">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/60 bg-sky-100 text-sky-600 shadow-inner shadow-sky-200/70">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{actor.name}</h2>
                      <p className="text-sm text-slate-600">{actor.focus}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {actor.responsibilities.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-14 grid gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/85 p-8 shadow-xl shadow-sky-100/70">
            <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-sky-200/40 blur-2xl" />
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-3 text-sky-700">
                <CalendarCheck className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Alur Mekanisme</span>
              </div>
              <ol className="space-y-4 text-sm leading-relaxed text-slate-700">
                {steps.map((step, idx) => (
                  <li key={step.title} className="rounded-2xl border border-sky-200/60 bg-white/70 p-4">
                    <div className="flex items-center gap-3 text-sky-700">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-300/70 bg-sky-100 text-sm font-semibold text-sky-600">
                        {idx + 1}
                      </span>
                      <p className="text-base font-semibold text-slate-900">{step.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-8 shadow-xl shadow-sky-100/70 backdrop-blur-md">
            <div className="absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-teal-200/40 blur-2xl" />
            <div className="relative flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 text-sky-700">
                <Map className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Peta Hubungan Aktor</span>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white/70 p-4">
                <RelationshipMap />
              </div>
              <p className="text-xs text-slate-500">
                Garis solid menunjukkan aliran koordinasi rutin, garis putus-putus menandakan eskalasi yang dipicu indikator sistem.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/85 p-8 shadow-xl shadow-sky-100/70 backdrop-blur-md">
            <div className="absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-teal-200/40 blur-2xl" />
            <div className="relative flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 text-sky-700">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Tabel RACI</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-sky-100">
                <table className="min-w-full divide-y divide-sky-100 text-left text-sm text-slate-700">
                  <thead className="bg-sky-100 text-xs uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Aktivitas</th>
                      <th className="px-4 py-3">R</th>
                      <th className="px-4 py-3">A</th>
                      <th className="px-4 py-3">C</th>
                      <th className="px-4 py-3">I</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 bg-white/80">
                    {raciMatrix.map((row) => (
                      <tr key={row.activity}>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.activity}</td>
                        <td className="px-4 py-3">{row.r}</td>
                        <td className="px-4 py-3">{row.a}</td>
                        <td className="px-4 py-3">{row.c}</td>
                        <td className="px-4 py-3">{row.i}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                R = Responsible, A = Accountable, C = Consulted, I = Informed.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/85 p-8 shadow-xl shadow-sky-100/70">
            <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-sky-200/40 blur-2xl" />
            <div className="relative flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 text-sky-700">
                <Shield className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Istilah Kunci &amp; Rute Integrasi</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-700">
                {integrations.map((item) => (
                  <li key={item.term} className="rounded-2xl border border-sky-200/60 bg-white/70 p-4">
                    <div className="text-base font-semibold text-slate-900">{item.term}</div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest text-sky-600">
                      {item.route}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
