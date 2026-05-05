"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

import InsightLayout from "@/components/InsightLayout";
import DetailRekapSection from "@/components/insight/DetailRekapSection";
import { DEFAULT_INSIGHT_TABS } from "@/components/insight/tabs";
import Loader from "@/components/Loader";
import RekapAmplifikasi from "@/components/RekapAmplifikasi";
import InstagramLinkUploadSegment from "@/components/InstagramLinkUploadSegment";
import useAuth from "@/hooks/useAuth";
import useLikesDateSelector from "@/hooks/useLikesDateSelector";
import useRequireAuth from "@/hooks/useRequireAuth";
import { getClientNames, getClientProfile, getRekapAmplifyKhusus } from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";

const normalizeRolePayload = (value) =>
  String(value || "").trim().toLowerCase() || undefined;

const normalizeScopePayload = (value) =>
  String(value || "").trim().toLowerCase() || undefined;

export default function AmplifyKhususInsightView({ initialTab = "insight" }) {
  useRequireAuth();
  const { token, clientId, role, effectiveRole, effectiveClientType, regionalId, profile } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab === "rekap" ? "rekap" : "insight");
  const rekapSectionRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { viewBy, normalizedCustomDate, normalizedRange } = useLikesDateSelector();

  useEffect(() => {
    if (initialTab === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [initialTab]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    if (!token || !clientId) {
      setError("Token atau Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return () => controller.abort();
    }

    const selectedDate = viewBy === "custom_range" ? normalizedRange : normalizedCustomDate;
    const { periode, date, startDate, endDate } = getPeriodeDateForView(viewBy, selectedDate);
    const normalizedRole = normalizeRolePayload(effectiveRole ?? role);
    const normalizedScope = normalizeScopePayload(effectiveClientType);
    const resolvedRegionalId =
      regionalId || profile?.regional_id || profile?.regionalId || profile?.regionalID || profile?.regional;
    const profileRequestContext = {
      role: normalizedRole,
      scope: normalizedScope,
      regional_id: resolvedRegionalId,
    };

    async function fetchData() {
      try {
        const rekapRes = await getRekapAmplifyKhusus(token, clientId, periode, date, startDate, endDate, {
          role: normalizedRole,
          scope: normalizedScope,
          regional_id: resolvedRegionalId,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        const profileRes = await getClientProfile(token, clientId, controller.signal, profileRequestContext);
        if (controller.signal.aborted) return;
        const clientProfile = profileRes.client || profileRes.profile || profileRes || {};
        const isDirectorate = (clientProfile.client_type || "").toUpperCase() === "DIREKTORAT";

        if (isDirectorate) {
          const nameMap = await getClientNames(
            token,
            users.map((u) => String(u.client_id || u.clientId || u.clientID || u.id || u.client || "")),
            controller.signal,
            profileRequestContext,
          );
          if (controller.signal.aborted) return;
          setChartData(
            users.map((u) => ({
              ...u,
              nama_client:
                nameMap[String(u.client_id || u.clientId || u.clientID || u.id || u.client || "")] ||
                u.nama_client ||
                u.client_name ||
                u.client,
            })),
          );
        } else {
          setChartData(users);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(`Gagal mengambil data: ${err.message || err}`);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [
    token,
    clientId,
    role,
    effectiveRole,
    effectiveClientType,
    regionalId,
    viewBy,
    normalizedCustomDate,
    normalizedRange?.startDate,
    normalizedRange?.endDate,
    profile,
  ]);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-slate-700">
        <div className="rounded-3xl border border-rose-300/60 bg-white/80 px-8 py-6 text-center text-rose-600 shadow-[0_0_35px_rgba(248,113,113,0.18)] backdrop-blur">
          {error}
        </div>
      </div>
    );
  }

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const headerAction = (
    <Link
      href="/amplify"
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
    >
      <Home className="h-4 w-4" />
      Amplify Rutin
    </Link>
  );

  return (
    <InsightLayout
      title="Amplifikasi Tugas Khusus"
      description="Pantau progres tugas khusus dengan rekap detail user yang mudah dibaca."
      tabs={DEFAULT_INSIGHT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      heroContent={null}
      headerAction={headerAction}
    >
      {activeTab === "insight" && (
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-sm text-slate-600">
            Menampilkan seluruh data pelaksanaan tugas khusus per user. Semua nilai kosong ditampilkan sebagai "-".
          </div>
          <InstagramLinkUploadSegment />
          <RekapAmplifikasi users={chartData} fileNamePrefix="rekap-amplify-khusus" />
        </div>
      )}

      <DetailRekapSection
        sectionRef={rekapSectionRef}
        title="Rekapitulasi Amplifikasi Tugas Khusus"
        description="Rekap detail siap dipantau tanpa berpindah halaman."
        showContent={activeTab === "rekap"}
      >
        <RekapAmplifikasi users={chartData} />
      </DetailRekapSection>
    </InsightLayout>
  );
}
