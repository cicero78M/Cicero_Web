"use client";

import React from "react";

/**
 * DetailRekapSection menyajikan layout standar untuk segmen rekap detail
 * pada halaman insight. Komponen ini memfasilitasi konsistensi tampilan
 * antara berbagai kanal sosial seperti Instagram dan TikTok.
 *
 * @param {object} props
 * @param {React.RefObject<HTMLElement>} [props.sectionRef] - Referensi ke elemen section untuk scroll.
 * @param {string} [props.id="rekap-detail"] - ID unik untuk section.
 * @param {string} props.title - Judul rekap detail.
 * @param {string} props.description - Deskripsi singkat yang mendukung judul.
 * @param {boolean} [props.showContent=true] - Tentukan apakah konten anak dirender.
 * @param {React.ReactNode} props.children - Konten utama rekap.
 */
export default function DetailRekapSection({
  sectionRef,
  id = "rekap-detail",
  title,
  description,
  showContent = true,
  children,
}) {
  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 p-4 shadow-[0_24px_60px_rgba(59,130,246,0.12)] backdrop-blur"
    >
      <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-6 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-2 border-b border-blue-100/80 pb-4">
          <h2 className="text-2xl font-semibold text-blue-900">{title}</h2>
          <p className="text-sm text-blue-700/80">{description}</p>
        </div>

        {showContent && <div className="pt-4">{children}</div>}
      </div>
    </section>
  );
}
