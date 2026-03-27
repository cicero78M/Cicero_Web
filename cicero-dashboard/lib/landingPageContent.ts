import {
  ArrowRight,
  BookOpenText,
  ClipboardCheck,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  Waypoints,
} from "lucide-react";

export const primaryContactHref = "https://wa.me/6281235114745";

export const heroContent = {
  eyebrow: "Landing Page Publik Cicero",
  title: "Koordinasikan evaluasi operasional digital tanpa memutus alur kerja tim.",
  description:
    "Cicero membantu koordinator dan pengambil keputusan meninjau dashboard, jalur absensi digital, serta panduan SOP dalam satu pintu masuk yang lebih jelas untuk evaluasi awal.",
  supportPoints: [
    "Dashboard insight dan ringkasan operasional tetap terhubung ke alur login yang ada.",
    "Knowledge base publik untuk mekanisme absensi dan panduan SOP tetap mudah diakses.",
    "Jalur claim profil dan update akses login tetap tersedia sebagai aksi sekunder.",
  ],
};

export const primaryCta = {
  label: "Jadwalkan konsultasi",
  href: primaryContactHref,
  icon: ArrowRight,
};

export const secondaryHeroCtas = [
  {
    label: "Masuk dashboard",
    href: "/login",
  },
  {
    label: "Claim profil",
    href: "/claim",
  },
];

export const headerLinks = [
  {
    label: "Panduan SOP",
    href: "/panduan-sop",
  },
  {
    label: "Login",
    href: "/login",
  },
];

export const valueMessages = [
  {
    title: "Operasional lebih mudah dipetakan",
    description:
      "Arahkan tim ke dashboard, rekap, dan panduan kerja yang sudah ada tanpa menjadikan landing page sebagai katalog klaim yang tidak tervalidasi.",
    icon: LayoutDashboard,
  },
  {
    title: "SOP publik tetap terlihat",
    description:
      "Rute mekanisme absensi dan panduan SOP tetap tersedia untuk briefing, audit proses, dan orientasi awal pihak terkait.",
    icon: BookOpenText,
  },
  {
    title: "Akses internal tetap rapi",
    description:
      "Login dashboard, claim profil, dan pembaruan akses login tetap diposisikan sebagai jalur lanjutan, bukan CTA publik utama.",
    icon: UserCheck,
  },
];

export const useCases = [
  {
    title: "Evaluasi kesiapan operasional",
    description:
      "Gunakan landing page untuk memahami bagaimana Cicero menghubungkan insight dashboard, referensi SOP, dan jalur akses pengguna sebelum rollout lebih lanjut.",
  },
  {
    title: "Koordinasi onboarding internal",
    description:
      "Arahkan anggota baru ke route publik yang relevan untuk login, claim profil, mekanisme absensi, dan SOP tanpa membebani satu halaman dengan semua detail teknis.",
  },
  {
    title: "Kontak awal yang lebih jelas",
    description:
      "Pengunjung baru langsung diarahkan ke jalur konsultasi agar diskusi kebutuhan dan implementasi terjadi di channel yang memang disiapkan untuk itu.",
  },
];

export const trustAssets = [
  {
    title: "Berbasis route dan dokumen yang sudah ada",
    description:
      "Konten publik mengacu pada dashboard Cicero, halaman mekanisme absensi, halaman panduan SOP, dan alur claim/login yang sudah tersedia di repository.",
    icon: ClipboardCheck,
  },
  {
    title: "Tanpa metrik publik yang tidak tervalidasi",
    description:
      "Halaman ini tidak lagi menampilkan KPI promosi, paket harga tetap, testimonial internal, atau form sukses semu yang belum punya dasar operasional yang jelas.",
    icon: ShieldCheck,
  },
  {
    title: "Redirect autentikasi tetap dipertahankan",
    description:
      "Pengguna yang sudah login tetap diarahkan ke route terakhir yang valid atau ke dashboard, mengikuti mekanisme existing `useAuthRedirect`.",
    icon: Waypoints,
  },
];

export const secondaryPaths = [
  {
    title: "Login dashboard",
    description: "Masuk ke dashboard utama Cicero untuk pengguna yang sudah memiliki akses.",
    href: "/login",
    ctaLabel: "Buka login dashboard",
  },
  {
    title: "Update akses login",
    description: "Gunakan jalur ini saat pengguna perlu memperbarui akses login yang sudah dimiliki.",
    href: "/login-update",
    ctaLabel: "Buka update akses login",
  },
  {
    title: "Claim profil",
    description: "Selesaikan registrasi awal dan pembaruan profil claim tanpa alur OTP email lama.",
    href: "/claim",
    ctaLabel: "Buka portal claim",
  },
  {
    title: "Mekanisme absensi",
    description: "Tinjau alur absensi digital, aktor utama, dan matriks kerja yang menopang operasional.",
    href: "/mekanisme-absensi",
    ctaLabel: "Lihat mekanisme absensi",
  },
  {
    title: "Panduan SOP",
    description: "Buka pusat referensi SOP untuk registrasi, operator, dan alur kerja pendukung.",
    href: "/panduan-sop",
    ctaLabel: "Lihat panduan SOP",
  },
];

export const footerContent = {
  title: "Perlu memetakan alur implementasi Cicero untuk tim Anda?",
  description:
    "Mulai dari konsultasi singkat. Setelah itu, tim dapat diarahkan ke login, claim, atau route panduan yang sesuai tanpa menebak-nebak jalur masuk.",
};
