"use client";

import { useMemo, useState } from "react";
import { Copy, FileText, MessageSquareText } from "lucide-react";
import { showToast } from "@/utils/showToast";

export default function ExecutiveRecapCard({
  title,
  description,
  summary,
  briefText,
  fullText,
}) {
  const [mode, setMode] = useState("brief");

  const activeText = useMemo(() => (mode === "full" ? fullText || briefText : briefText), [mode, briefText, fullText]);

  async function handleCopy() {
    if (!activeText) return;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(activeText);
        showToast(`Briefing ${mode === "full" ? "lengkap" : "ringkas"} disalin.`, "success");
        return;
      } catch (error) {
        showToast("Gagal menyalin briefing. Izinkan akses clipboard di browser Anda.", "error");
      }
    }

    if (typeof window !== "undefined") {
      window.prompt("Salin briefing secara manual:", activeText);
      showToast("Clipboard tidak tersedia. Silakan salin manual.", "info");
    }
  }

  if (!briefText) return null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <MessageSquareText className="h-3.5 w-3.5" />
            Executive Recap
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title || "Briefing siap kirim"}</h3>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            {summary ? <p className="mt-2 text-sm font-medium text-emerald-700">{summary}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("brief")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "brief" ? "bg-emerald-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Ringkas
          </button>
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "full" ? "bg-emerald-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Lengkap
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-inner">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <FileText className="h-4 w-4" />
          Preview briefing {mode === "full" ? "lengkap" : "ringkas"}
        </div>
        <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{activeText}</pre>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300"
        >
          <Copy className="h-4 w-4" />
          Copy briefing {mode === "full" ? "lengkap" : "ringkas"}
        </button>
      </div>
    </section>
  );
}
