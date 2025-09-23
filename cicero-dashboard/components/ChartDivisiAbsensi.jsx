"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { useEffect, useState } from "react";
import { getClientNames } from "@/utils/api";
import ChartDataTable from "@/components/ChartDataTable";

// Bersihkan "POLSEK" dan awalan angka pada nama divisi/satfung
function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "") // hapus kata "POLSEK"
    .replace(/^[0-9.\-\s]+/, "") // hapus awalan angka/strip/titik
    .trim();
}

export default function ChartDivisiAbsensi({
  users,
  title = "Absensi Komentar TikTok per Divisi/Satfung",
  totalPost, // jumlah post untuk perbandingan, generic
  totalIGPost, // fallback untuk instagram (kompatibilitas lama)
  totalTiktokPost, // fallback untuk tiktok (kompatibilitas lama)
  fieldJumlah = "jumlah_like", // bisa "jumlah_komentar" untuk tiktok
  labelSudah = "User Sudah Komentar",
  labelKurang = "User Kurang Komentar",
  labelBelum = "User Belum Komentar",
  labelTotal = "Total Komentar",
  groupBy = "divisi",
  orientation = "vertical",
  showTotalUser = false,
  labelTotalUser = "Jumlah User",
  sortBy = "total_value",
}) {
  const [enrichedUsers, setEnrichedUsers] = useState(users);

  // Enrich user data with client names when grouping by client_id.
  useEffect(() => {
    async function enrich() {
      if (groupBy !== "client_id") {
        setEnrichedUsers(users);
        return;
      }

        const needsName = users.some(
          (u) => !(u.nama_client || u.client_name || u.client)
        );
      if (!needsName) {
        setEnrichedUsers(users);
        return;
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cicero_token")
          : null;
      if (!token) {
        setEnrichedUsers(users);
        return;
      }

      try {
        const ids = users.map((u) =>
          String(
            u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? ""
          )
        );
        const nameMap = await getClientNames(token, ids);
        const mapped = users.map((u) => ({
          ...u,
          nama_client:
            u.nama_client ||
            nameMap[
              String(
                u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? ""
              )
            ] ||
            u.client_name ||
            u.client,
        }));
        setEnrichedUsers(mapped);
      } catch {
        setEnrichedUsers(users);
      }
    }

    enrich();
  }, [users, groupBy]);

  // Fallback backward compatibility
  const effectiveTotal =
    typeof totalPost !== "undefined"
      ? totalPost
      : typeof totalTiktokPost !== "undefined"
      ? totalTiktokPost
      : totalIGPost;

  // Jika tidak ada post, semua user dianggap belum
  const isZeroPost = (effectiveTotal || 0) === 0;

  // Group by divisi atau client_id jika diminta
  const divisiMap = {};
  const labelKey = groupBy === "client_id" ? "client_name" : "divisi";
  enrichedUsers.forEach((u) => {
    const idKey = String(
      u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? "LAINNYA",
    );
    const key =
      groupBy === "client_id"
        ? idKey
        : bersihkanSatfung(u.divisi || "LAINNYA");
    const display =
      groupBy === "client_id"
        ? u.nama_client || u.client_name || u.client || idKey
        : key;
    const jumlah = Number(u[fieldJumlah] || 0);
    const hasUsername = Boolean(String(u.username || "").trim());
    const sudah = !isZeroPost && jumlah >= effectiveTotal * 0.5;
    const kurang = !sudah && !isZeroPost && jumlah > 0;
    const nilai = jumlah;
    if (!divisiMap[key])
      divisiMap[key] = {
        [labelKey]: display,
        total_user: 0,
        user_sudah: 0,
        user_kurang: 0,
        user_belum: 0,
        total_value: 0,
        user_with_username: 0,
        user_without_username: 0,
      };
    divisiMap[key].total_user += 1;
    divisiMap[key].total_value += nilai;
    if (hasUsername) {
      divisiMap[key].user_with_username += 1;
    } else {
      divisiMap[key].user_without_username += 1;
    }
    if (sudah) {
      divisiMap[key].user_sudah += 1;
    } else if (kurang) {
      divisiMap[key].user_kurang += 1;
    } else {
      divisiMap[key].user_belum += 1;
    }
  });

  const DIRECTORATE_NAME = "direktorat binmas";
  const normalizeClientName = (name = "") =>
    String(name).toLowerCase().replace(/\s+/g, " ").trim();
  const isDirektoratBinmas = (name = "") => {
    const normalized = normalizeClientName(name);
    if (!normalized.startsWith(DIRECTORATE_NAME)) {
      return false;
    }
    const nextChar = normalized.charAt(DIRECTORATE_NAME.length);
    return nextChar === "" || /[^a-z0-9]/.test(nextChar);
  };
  const toUsernameCompletion = (entry) => {
    const withUsername =
      entry.user_with_username ??
      entry.total_user - (entry.user_without_username ?? 0);
    return entry.total_user ? withUsername / entry.total_user : 0;
  };
  const getUserBucket = (totalUser) => {
    const count = Number(totalUser) || 0;
    if (count > 250) return 1;
    if (count >= 200) return 2;
    if (count >= 150) return 3;
    if (count >= 100) return 4;
    if (count >= 50) return 5;
    return 6;
  };

  const dataChart = Object.values(divisiMap).sort((a, b) => {
    const isDirectorateSort = groupBy === "client_id";
    if (isDirectorateSort) {
      const nameA = String(a[labelKey] || "").trim();
      const nameB = String(b[labelKey] || "").trim();
      const isBinmasA = isDirektoratBinmas(nameA);
      const isBinmasB = isDirektoratBinmas(nameB);
      if (isBinmasA !== isBinmasB) {
        return isBinmasA ? -1 : 1;
      }

      const totalLikesA = Number(a.total_value) || 0;
      const totalLikesB = Number(b.total_value) || 0;
      if (totalLikesA !== totalLikesB) {
        return totalLikesB - totalLikesA;
      }

      if (sortBy === "percentage") {
        const bucketA = getUserBucket(a.total_user);
        const bucketB = getUserBucket(b.total_user);
        if (bucketA !== bucketB) {
          return bucketA - bucketB;
        }

        const percUsernameA = toUsernameCompletion(a);
        const percUsernameB = toUsernameCompletion(b);
        if (percUsernameA !== percUsernameB) {
          return percUsernameB - percUsernameA;
        }
      }

      if (a.total_user !== b.total_user) {
        return b.total_user - a.total_user;
      }

      return nameA.localeCompare(nameB);
    }

    if (sortBy === "percentage") {
      const percA = a.total_user ? a.user_sudah / a.total_user : 0;
      const percB = b.total_user ? b.user_sudah / b.total_user : 0;
      return percB - percA;
    }
    return b.total_value - a.total_value;
  });

  // Dynamic height
  const isHorizontal = orientation === "horizontal";
  const isDirectorate = groupBy === "client_id";
  const thicknessMultiplier = isDirectorate ? 3 : 1;
  const barHeight = isHorizontal ? 40 * thicknessMultiplier : 34;
  // Ensure horizontal charts (used in direktorat views) remain legible
  // by providing a larger minimum height and capping extreme values.
  const minHeight = isHorizontal ? (isDirectorate ? 420 : 300) : 220;
  const maxHeight = isHorizontal ? 900 : 420;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * dataChart.length),
  );

  const numberFormatter = new Intl.NumberFormat("id-ID");
  const percentFormatter = new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const entityColumnLabel =
    groupBy === "client_id" ? "Client" : "Divisi/Client";
  const tableColumns = [
    { key: "entity", header: entityColumnLabel, isRowHeader: true },
    { key: "total_user", header: labelTotalUser, align: "right" },
    { key: "user_sudah", header: labelSudah, align: "right" },
    {
      key: "user_sudah_pct",
      header: `${labelSudah} (%)`,
      align: "right",
    },
    { key: "user_kurang", header: labelKurang, align: "right" },
    {
      key: "user_kurang_pct",
      header: `${labelKurang} (%)`,
      align: "right",
    },
    { key: "user_belum", header: labelBelum, align: "right" },
    {
      key: "user_belum_pct",
      header: `${labelBelum} (%)`,
      align: "right",
    },
    { key: "total_value", header: labelTotal, align: "right" },
  ];
  const tableRows = dataChart.map((entry) => {
    const totalUser = entry.total_user ?? 0;
    const safeRatio = (value) =>
      totalUser ? Number(value || 0) / totalUser : 0;
    return {
      id: entry[labelKey] || entry.divisi,
      entity: entry[labelKey] || entry.divisi || "-",
      total_user: numberFormatter.format(entry.total_user ?? 0),
      user_sudah: numberFormatter.format(entry.user_sudah ?? 0),
      user_sudah_pct: percentFormatter.format(safeRatio(entry.user_sudah)),
      user_kurang: numberFormatter.format(entry.user_kurang ?? 0),
      user_kurang_pct: percentFormatter.format(safeRatio(entry.user_kurang)),
      user_belum: numberFormatter.format(entry.user_belum ?? 0),
      user_belum_pct: percentFormatter.format(safeRatio(entry.user_belum)),
      total_value: numberFormatter.format(entry.total_value ?? 0),
    };
  });

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{
              top: 4,
              right: 4,
              left: 4,
              bottom: 4,
            }}
            barCategoryGap={isHorizontal ? "30%" : "16%"}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <XAxis type="number" fontSize={12} />
            ) : (
              <XAxis
                dataKey={labelKey}
                type="category"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 15, fontWeight: 700, fill: "#1e293b" }}
              />
            )}
            {isHorizontal ? (
              <YAxis
                dataKey={labelKey}
                type="category"
                width={200}
                interval={0}
                tick={({ x, y, payload }) => (
                  <>
                    <title>{payload.value}</title>
                    <text
                      x={x - 180}
                      y={y + 10}
                      fontSize={12}
                      fontWeight={700}
                      fill="#1e293b"
                      textAnchor="start"
                    >
                      {payload.value}
                    </text>
                  </>
                )}
              />
            ) : (
              <YAxis type="number" fontSize={12} />
            )}
            <Tooltip
              formatter={(value, name) =>
                [
                  value,
                  name === "total_user"
                    ? labelTotalUser
                    : name === "user_sudah"
                    ? labelSudah
                    : name === "user_kurang"
                    ? labelKurang
                    : name === "user_belum"
                    ? labelBelum
                    : name === "total_value"
                    ? labelTotal
                    : name,
                ]
              }
              labelFormatter={(label) =>
                `${labelKey === "client_name" ? "Client" : "Divisi"}: ${label}`
              }
            />
            <Legend />
            {showTotalUser && (
              <Bar
                dataKey="total_user"
                fill="#0ea5e9"
                name={labelTotalUser}
                barSize={isHorizontal ? 20 * thicknessMultiplier : undefined}
              >
                <LabelList
                  dataKey="total_user"
                  position={isHorizontal ? "right" : "top"}
                  fontSize={isHorizontal ? 10 : 12}
                />
              </Bar>
            )}
            <Bar
              dataKey="user_sudah"
              fill="#22c55e"
              name={labelSudah}
              barSize={isHorizontal ? 20 * thicknessMultiplier : undefined}
            >
              <LabelList
                dataKey="user_sudah"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
            <Bar
              dataKey="user_kurang"
              fill="#f97316"
              name={labelKurang}
              barSize={isHorizontal ? 20 * thicknessMultiplier : undefined}
            >
              <LabelList
                dataKey="user_kurang"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
            <Bar
              dataKey="user_belum"
              fill="#ef4444"
              name={labelBelum}
              barSize={isHorizontal ? 20 * thicknessMultiplier : undefined}
            >
              <LabelList
                dataKey="user_belum"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
            <Bar
              dataKey="total_value"
              fill="#2563eb"
              name={labelTotal}
              barSize={isHorizontal ? 20 * thicknessMultiplier : undefined}
            >
              <LabelList
                dataKey="total_value"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartDataTable
          title={title}
          columns={tableColumns}
          rows={tableRows}
        />
      </div>
    </div>
  );
}
