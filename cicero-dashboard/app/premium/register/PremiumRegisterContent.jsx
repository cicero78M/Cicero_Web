"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Shield } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";

const whatsappTarget =
  "https://wa.me/+6281235114745?text=" +
  encodeURIComponent(
    "Halo Tim Cicero, saya ingin mendaftarkan paket Premium.\n\nNama Lengkap:\nNRP / Email:\nSatker / Divisi:\nNomor WA Dashboard (penerima recap):\nPilihan periode (harian/mingguan/bulanan/kustom):\nCatatan tambahan:",
  );

const templateMessage = `Halo Tim Cicero, saya ingin mendaftarkan paket Premium.

Nama Lengkap:
NRP / Email:
Satker / Divisi:
Nomor WA Dashboard (penerima recap):
Pilihan periode (harian/mingguan/bulanan/kustom):
Catatan tambahan:`;

export default function PremiumRegisterContent() {
  useRequireAuth();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/premium"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-inner transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke halaman Premium
        </Link>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
          Pendaftaran
        </span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-indigo-100/80 bg-white/80 p-7 shadow-[0_18px_48px_-30px_rgba(99,102,241,0.55)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Formulir Permintaan Premium</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Isi detail berikut, salin template, lalu kirim ke WA Bot Cicero. Tim kami akan
              memverifikasi dan mengaktifkan recap otomatis ke nomor dashboard Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-inner">
            <Shield className="h-5 w-5" />
            Layanan dipantau tim CICERO
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-inner">
            <h2 className="text-sm font-semibold text-slate-800">Langkah cepat</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
              <li>Salin template permintaan di samping.</li>
              <li>Lengkapi data: kontak, satker/divisi, dan nomor WA dashboard.</li>
              <li>Kirim lewat WA Bot menggunakan tombol <strong>Daftar Sekarang</strong>.</li>
              <li>Tunggu konfirmasi aktivasi recap otomatis dari tim CICERO.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-[0_15px_32px_-25px_rgba(56,189,248,0.6)]">
            <h2 className="text-sm font-semibold text-slate-800">Template WA</h2>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm font-mono text-slate-700">
              <pre className="whitespace-pre-wrap break-words">{templateMessage}</pre>
            </div>
            <a
              href={whatsappTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-14px_rgba(79,70,229,0.55)] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
            >
              <MessageCircle className="h-4 w-4" />
              Daftar Sekarang via WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/70 p-4 text-sm text-indigo-800 shadow-inner">
            <p className="font-semibold">Nomor WA Dashboard</p>
            <p className="mt-1 text-indigo-700/80">
              Gunakan nomor yang sama dengan login dashboard agar recap otomatis terkirim ke kanal yang tepat.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-50 bg-sky-50/70 p-4 text-sm text-sky-800 shadow-inner">
            <p className="font-semibold">Periode ANEV</p>
            <p className="mt-1 text-sky-700/80">
              Sebutkan kebutuhan periode (harian, mingguan, bulanan, atau rentang kustom) untuk konfigurasi jadwal recap.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 p-4 text-sm text-emerald-800 shadow-inner">
            <p className="font-semibold">Operator & panduan</p>
            <p className="mt-1 text-emerald-700/80">
              Operator menerima panduan khusus beserta link unduhan Excel agar pelaporan premium langsung siap pakai.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
