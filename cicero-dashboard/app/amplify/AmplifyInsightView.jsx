"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Link as LinkIcon,
  User,
  X,
} from "lucide-react";

import ChartHorizontal from "@/components/ChartHorizontal";
import InsightLayout from "@/components/InsightLayout";
import ChartBox from "@/components/likes/instagram/Insight/ChartBox";
import DetailRekapSection from "@/components/insight/DetailRekapSection";
import EngagementInsightMobileScaffold from "@/components/insight/EngagementInsightMobileScaffold";
import { DEFAULT_INSIGHT_TABS } from "@/components/insight/tabs";
import Loader from "@/components/Loader";
import RekapAmplifikasi from "@/components/RekapAmplifikasi";
import useAuth from "@/hooks/useAuth";
import useLikesDateSelector from "@/hooks/useLikesDateSelector";
import useRequireAuth from "@/hooks/useRequireAuth";
import { getClientNames, getClientProfile, getRekapAmplify } from "@/utils/api";
import { groupUsersByKelompok } from "@/utils/instagramEngagement";
import { showToast } from "@/utils/showToast";
import { buildAmplifyRekap } from "@/utils/amplifyRekap";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";

const numberFormatter = new Intl.NumberFormat("id-ID");

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

const normalizeRolePayload = (value) =>
  String(value || "").trim().toLowerCase() || undefined;

const normalizeScopePayload = (value) =>
  String(value || "").trim().toUpperCase() || undefined;

export default function AmplifyInsightView({ initialTab = "insight" }) {
  useRequireAuth();
  const {
    token,
    clientId,
    role,
    effectiveRole,
    effectiveClientType,
    regionalId,
    profile,
  } = useAuth();
  const [activeTab, setActiveTab] = useState(
    initialTab === "rekap" ? "rekap" : "insight",
  );
  const rekapSectionRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahPost: 0,
    totalBelumPost: 0,
    totalLink: 0,
  });

  const {
    viewBy,
    viewOptions,
    selectorDateValue,
    handleViewChange,
    handleDateChange,
    normalizedCustomDate,
    normalizedRange,
    reportPeriodeLabel,
  } = useLikesDateSelector();

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

    const selectedDate =
      viewBy === "custom_range" ? normalizedRange : normalizedCustomDate;
    const { periode, date, startDate, endDate } = getPeriodeDateForView(
      viewBy,
      selectedDate,
    );
    const normalizedRole = normalizeRolePayload(effectiveRole ?? role);
    const normalizedScope = normalizeScopePayload(effectiveClientType);
    const resolvedRegionalId =
      regionalId ||
      profile?.regional_id ||
      profile?.regionalId ||
      profile?.regionalID ||
      profile?.regional;

    async function fetchData() {
      try {
        const rekapRes = await getRekapAmplify(
          token,
          clientId,
          periode,
          date,
          startDate,
          endDate,
          {
            role: normalizedRole,
            scope: normalizedScope,
            regional_id: resolvedRegionalId,
            signal: controller.signal,
          },
        );
        if (controller.signal.aborted) return;
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        const profileRes = await getClientProfile(
          token,
          clientId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const profile =
          profileRes.client || profileRes.profile || profileRes || {};
        const resolvedClientName =
          profile.nama ||
          profile.nama_client ||
          profile.client_name ||
          profile.client ||
          "";
        setClientName(resolvedClientName);
        const dir =
          (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        setIsDirectorate(dir);

        let enrichedUsers = users;
        if (dir) {
          const nameMap = await getClientNames(
            token,
            users.map((u) =>
              String(
                u.client_id ||
                  u.clientId ||
                  u.clientID ||
                  u.id ||
                  u.client ||
                  "",
              ),
            ),
            controller.signal,
          );
          if (controller.signal.aborted) return;
          enrichedUsers = users.map((u) => ({
            ...u,
            nama_client:
              nameMap[
                String(
                  u.client_id ||
                    u.clientId ||
                    u.clientID ||
                    u.id ||
                    u.client ||
                    "",
                )
              ] ||
              u.nama_client ||
              u.client_name ||
              u.client,
          }));
        }

        const totalUser = enrichedUsers.length;
        const totalSudahPost = enrichedUsers.filter(
          (user) => Number(user.jumlah_link) > 0,
        ).length;
        const totalBelumPost = totalUser - totalSudahPost;
        const totalLink = enrichedUsers.reduce(
          (sum, user) => sum + Number(user.jumlah_link || 0),
          0,
        );

        setRekapSummary({
          totalUser,
          totalSudahPost,
          totalBelumPost,
          totalLink,
        });
        setChartData(enrichedUsers);
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
  ]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-slate-700">
        <div className="rounded-3xl border border-rose-300/60 bg-white/80 px-8 py-6 text-center text-rose-600 shadow-[0_0_35px_rgba(248,113,113,0.18)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);

  const totalUser = Number(rekapSummary.totalUser) || 0;
  const totalSudahPost = Number(rekapSummary.totalSudahPost) || 0;
  const totalBelumPost = Number(rekapSummary.totalBelumPost) || 0;
  const totalLink = Number(rekapSummary.totalLink) || 0;

  const completionRate = totalUser
    ? (totalSudahPost / totalUser) * 100
    : undefined;
  const backlogRate = totalUser ? (totalBelumPost / totalUser) * 100 : undefined;
  const averageLink = totalUser ? totalLink / totalUser : 0;

  const summaryCards = [
    {
      key: "total-link",
      label: "Total Link Amplifikasi",
      value: formatNumber(totalLink),
      color: "indigo",
      icon: <LinkIcon className="h-6 w-6" />,
    },
    {
      key: "total-user",
      label: "Total User",
      value: formatNumber(totalUser),
      color: "slate",
      icon: <User className="h-6 w-6" />,
    },
    {
      key: "sudah-post",
      label: "Sudah Post",
      value: formatNumber(totalSudahPost),
      color: "green",
      icon: <Check className="h-6 w-6" />,
      percentage: completionRate,
    },
    {
      key: "belum-post",
      label: "Belum Post",
      value: formatNumber(totalBelumPost),
      color: "red",
      icon: <X className="h-6 w-6" />,
      percentage: backlogRate,
    },
  ];

  const quickInsights = [
    {
      title: "Kepatuhan amplifikasi",
      detail:
        completionRate !== undefined
          ? `${Math.round(completionRate)}% akun sudah membagikan link pada periode ini.`
          : "Menunggu data kepatuhan amplifikasi.",
    },
    {
      title: "Prioritas tindak lanjut",
      detail:
        totalBelumPost > 0
          ? `${formatNumber(totalBelumPost)} akun belum melakukan amplifikasi dan perlu follow up.`
          : "Seluruh akun sudah melakukan amplifikasi.",
    },
    {
      title: "Rata-rata distribusi",
      detail:
        totalLink > 0
          ? `Rata-rata ${averageLink.toFixed(1)} link dibagikan per user pada periode ini.`
          : "Belum ada link yang terdistribusi di periode ini.",
    },
  ];

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCopyRekap = async () => {
    const viewLabel = viewOptions.find((option) => option.value === viewBy)?.label;
    const message = buildAmplifyRekap(rekapSummary, {
      clientName,
      periodeLabel: reportPeriodeLabel,
      viewLabel,
    });

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        showToast("Rekap disalin ke clipboard.", "success");
        return;
      } catch (copyError) {
        showToast(
          "Gagal menyalin rekap. Izinkan akses clipboard di browser Anda.",
          "error",
        );
      }
    }

    if (typeof window !== "undefined") {
      window.prompt("Salin rekap amplifikasi secara manual:", message);
      showToast(
        "Clipboard tidak tersedia. Silakan salin rekap secara manual.",
        "info",
      );
    }
  };

  const directorateTitle = isDirectorate
    ? "POLRES JAJARAN"
    : "Divisi / Satfung";

  return (
    <InsightLayout
      title="Amplifikasi Link Insight"
      description="Pantau progres amplifikasi link harian dengan ringkasan cepat dan visualisasi per divisi."
      tabs={DEFAULT_INSIGHT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      heroContent={null}
    >
      {activeTab === "insight" && (
        <EngagementInsightMobileScaffold
          viewSelectorProps={{
            value: viewBy,
            onChange: handleViewChange,
            options: viewOptions,
            date: selectorDateValue,
            onDateChange: handleDateChange,
          }}
          onCopyRekap={handleCopyRekap}
          summaryCards={summaryCards}
          quickInsights={quickInsights}
          quickInsightTone="indigo"
        >
          {isDirectorate ? (
            <ChartBox
              title={directorateTitle}
              users={chartData}
              totalPost={1}
              groupBy="client_id"
              orientation="horizontal"
              fieldJumlah="jumlah_link"
              labelSudah="User Sudah Post"
              labelKurang="User Kurang Post"
              labelBelum="User Belum Post"
              labelTotal="Total Link Amplifikasi"
              sortBy="percentage"
              narrative="Ringkasan ini memperlihatkan kepatuhan amplifikasi link antar polres jajaran."
            />
          ) : (
            <div className="flex flex-col gap-6">
              <ChartBox
                title="BAG"
                users={kelompok?.BAG}
                totalPost={1}
                fieldJumlah="jumlah_link"
                labelSudah="User Sudah Post"
                labelKurang="User Kurang Post"
                labelBelum="User Belum Post"
                labelTotal="Total Link Amplifikasi"
                narrative="Perbandingan jumlah link dari user di divisi BAG."
                sortBy="percentage"
              />
              <ChartBox
                title="SAT"
                users={kelompok?.SAT}
                totalPost={1}
                fieldJumlah="jumlah_link"
                labelSudah="User Sudah Post"
                labelKurang="User Kurang Post"
                labelBelum="User Belum Post"
                labelTotal="Total Link Amplifikasi"
                narrative="Capaian amplifikasi link untuk divisi SAT."
                sortBy="percentage"
              />
              <ChartBox
                title="SI & SPKT"
                users={kelompok?.["SI & SPKT"]}
                totalPost={1}
                fieldJumlah="jumlah_link"
                labelSudah="User Sudah Post"
                labelKurang="User Kurang Post"
                labelBelum="User Belum Post"
                labelTotal="Total Link Amplifikasi"
                narrative="Distribusi link amplifikasi di divisi SI & SPKT."
                sortBy="percentage"
              />
              <ChartBox
                title="LAINNYA"
                users={kelompok?.LAINNYA}
                totalPost={1}
                fieldJumlah="jumlah_link"
                labelSudah="User Sudah Post"
                labelKurang="User Kurang Post"
                labelBelum="User Belum Post"
                labelTotal="Total Link Amplifikasi"
                narrative="Rangkuman divisi lainnya untuk distribusi link."
                sortBy="percentage"
              />
              <ChartHorizontal
                title="POLSEK"
                users={kelompok?.POLSEK || []}
                totalPost={1}
                fieldJumlah="jumlah_link"
                labelSudah="User Sudah Post"
                labelKurang="User Kurang Post"
                labelBelum="User Belum Post"
                labelTotal="Total Link Amplifikasi"
                labelTotalUser="Jumlah User"
                sortBy="percentage"
              />
            </div>
          )}
        </EngagementInsightMobileScaffold>
      )}

      <DetailRekapSection
        sectionRef={rekapSectionRef}
        title="Rekapitulasi Amplifikasi Link"
        description="Rekap detail siap dipantau tanpa berpindah halaman."
        showContent={activeTab === "rekap"}
      >
        <RekapAmplifikasi users={chartData} />
      </DetailRekapSection>
    </InsightLayout>
  );
}
