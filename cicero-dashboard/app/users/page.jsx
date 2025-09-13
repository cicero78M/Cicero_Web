"use client";
import { useEffect, useMemo, useState } from "react";
import usePersistentState from "@/hooks/usePersistentState";
import {
  getUserDirectory,
  createUser,
  updateUser,
  getClientProfile,
  getClientNames,
  updateUserRoles,
} from "@/utils/api";
import { Pencil, Check, X, RefreshCw } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import * as XLSX from "xlsx";

const PAGE_SIZE = 50;

const PANGKAT_OPTIONS = [
  "BHARADA",
  "BHARATU",
  "BHARAKA",
  "BRIPDA",
  "BRIPTU",
  "BRIGADIR",
  "BRIPKA",
  "AIPDA",
  "AIPTU",
  "IPDA",
  "IPTU",
  "AKP",
  "KOMPOL",
  "AKBP",
  "KOMISARIS BESAR POLISI",
  "JURU MUDA",
  "JURU MUDA TINGKAT I",
  "JURU",
  "JURU TINGKAT I",
  "PENGATUR MUDA",
  "PENGATUR MUDA TINGKAT I",
  "PENGATUR",
  "PENGATUR TINGKAT I",
  "PENATA MUDA",
  "PENATA MUDA TINGKAT I",
  "PENATA",
  "PENATA TINGKAT I",
  "PEMBINA",
  "PEMBINA TINGKAT I",
  "PEMBINA UTAMA MUDA",
  "PEMBINA UTAMA MADYA",
  "PEMBINA UTAMA",
];

const SATFUNG_OPTIONS = [
  "BAG LOG",
  "BAG SDM",
  "BAG REN",
  "BAG OPS",
  "SAT SAMAPTA",
  "SAT RESKRIM",
  "SAT INTEL",
  "SAT NARKOBA",
  "SAT BINMAS",
  "SAT LANTAS",
  "SI UM",
  "SI TIK",
  "SI WAS",
  "SI PROPAM",
  "SI DOKES",
  "SPKT",
  "SAT TAHTI",
  "DITBINMAS",
  "SUBBAGRENMIN",
  "BAGBINOPSNAL",
  "SUBDIT BINPOLMAS",
  "SUBDIT SATPAMPOLSUS",
  "SUBDIT BHABINKAMTIBMAS",
  "SUBDIT BINTIBSOS",
  "POLSEK",
];

export default function UserDirectoryPage() {
  useRequireAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = usePersistentState("users_page", 1);

  const [showForm, setShowForm] = useState(false);
  // state for new user form
  const [nama, setNama] = useState("");
  const [pangkat, setPangkat] = useState("");
  const [nrpNip, setNrpNip] = useState("");
  const [satfung, setSatfung] = useState("");
  const [polsekName, setPolsekName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // inline edit state
  const [editingRowId, setEditingRowId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editPangkat, setEditPangkat] = useState("");
  const [editNrpNip, setEditNrpNip] = useState("");
  const [editSatfung, setEditSatfung] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { token, clientId, role: authRole } = useAuth();
  const client_id = clientId || "BOJONEGORO";
  const role = authRole || "";

  const isDitbinmasClient = client_id === "DITBINMAS";
  const isDitbinmas =
    isDitbinmasClient && String(role).toLowerCase() === "ditbinmas";
  const [showAllDitbinmas, setShowAllDitbinmas] = useState(() => !isDitbinmas);

  const columnLabel = isDitbinmasClient
    ? showAllDitbinmas
      ? "Kesatuan"
      : "Divisi"
    : isDirectorate
    ? "Kesatuan"
    : "Satfung";
  const showKesatuanColumn = columnLabel === "Kesatuan";

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort(compareUsersByPangkatAndNrp),
    [users],
  );

  const rekapUsers = useMemo(() => {
    const grouped = {};
    sortedUsers
      .filter((u) => {
        if (isDitbinmasClient && !showAllDitbinmas) {
          const cid = String(
            u.client_id || u.clientId || u.clientID || u.client || "",
          ).toUpperCase();
          return cid === "DITBINMAS";
        }
        return true;
      })
      .forEach((u) => {
        const key = u.divisi || "-";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(u);
      });
    return grouped;
  }, [sortedUsers, isDitbinmasClient, showAllDitbinmas]);

  async function fetchUsers() {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }
    if (!client_id) {
      setError("Client ID tidak ditemukan.");
      setLoading(false);
      return;
    }
    try {
      const res = await getUserDirectory(token, client_id);
      let data = res.data || res.users || res;
      let arr = Array.isArray(data) ? data : [];

      const profileRes = await getClientProfile(token, client_id);
      const profile = profileRes.client || profileRes.profile || profileRes || {};
      const dir = (profile.client_type || "").toUpperCase() === "DIREKTORAT";
      setIsDirectorate(dir && !isDitbinmas);
      setClientName(
        profile.nama_client ||
          profile.client_name ||
          profile.client ||
          profile.nama ||
          client_id,
      );

      if (dir) {
        const nameMap = await getClientNames(
          token,
          arr.map((u) =>
            String(u.client_id || u.clientId || u.clientID || u.client || ""),
          ),
        );
        arr = arr.map((u) => ({
          ...u,
          nama_client:
            nameMap[
              String(u.client_id || u.clientId || u.clientID || u.client || "")
            ] ||
            u.nama_client ||
            u.client_name ||
            u.client,
        }));
      }

      setUsers(arr);
    } catch (err) {
      setError("Gagal mengambil data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);
    try {
      const trimmedNrpNip = nrpNip.trim();
      if (!/^\d+$/.test(trimmedNrpNip)) {
        throw new Error("NRP hanya boleh angka");
      }
      if (!PANGKAT_OPTIONS.includes(pangkat)) {
        throw new Error("Pangkat tidak valid");
      }
      const satfungValue =
        satfung === "POLSEK"
          ? polsekName.trim()
            ? `POLSEK ${polsekName.trim()}`
            : ""
          : satfung;
      if (
        satfung === "POLSEK" && !polsekName.trim()
      ) {
        throw new Error("Nama Polsek wajib diisi");
      }
      if (
        satfung !== "POLSEK" && !SATFUNG_OPTIONS.includes(satfung)
      ) {
        throw new Error("Satfung tidak valid");
      }
      await createUser(token || "", {
        client_id,
        nama,
        title: pangkat,
        user_id: trimmedNrpNip,
        divisi: satfungValue,
      });
      setNama("");
      setPangkat("");
      setNrpNip("");
      setSatfung("");
      setPolsekName("");
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setSubmitError(err.message || "Gagal menambah user");
    }
    setSubmitLoading(false);
  }

  function handleEditClick(user) {
    setEditingRowId(user.user_id);
    setEditNama(user.nama || "");
    setEditPangkat(user.title || "");
    setEditNrpNip((user.user_id || "").trim());
    setEditSatfung(user.divisi || "");
    setUpdateError("");
  }

  async function handleUpdateRow(userId) {
    setUpdateLoading(true);
    setUpdateError("");
    try {
      const trimmedNrpNip = editNrpNip.trim();
      await updateUser(token || "", userId, {
        nama: editNama,
        title: editPangkat,
        divisi: editSatfung,
        user_id: trimmedNrpNip,
      });
      if (userId !== trimmedNrpNip) {
        await updateUserRoles(token || "", userId, trimmedNrpNip);
      }
      await fetchUsers();
      setEditingRowId(null);
    } catch (err) {
      setUpdateError(err.message || "Gagal mengubah user");
    }
    setUpdateLoading(false);
  }

  async function handleCopyRekap() {
    const now = new Date();
    const day = now.toLocaleDateString("id-ID", { weekday: "long" });
    const date = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const time = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const allUsers = Object.values(rekapUsers).flat();
    const totalUser = allUsers.length;
    const totalUpdateIG = allUsers.filter((u) => u.insta).length;
    const totalUpdateTiktok = allUsers.filter((u) => u.tiktok).length;
    const totalBelumUpdate = allUsers.filter(
      (u) => !u.insta && !u.tiktok,
    ).length;

    const lines = [
      `Client Name: ${clientName || "-"}`,
      `${day}, ${date} ${time}`,
      "",
      `Total User : ${totalUser}`,
      `Update Instagram : ${totalUpdateIG}`,
      `Update Tiktok : ${totalUpdateTiktok}`,
      `Belum Update : ${totalBelumUpdate}`,
      "",
      "Rincian",
      "",
    ];
    Object.entries(rekapUsers).forEach(([sf, list]) => {
      lines.push(`*${sf}*`);
      list.forEach((u) => {
        lines.push(
          `${u.title ? `${u.title} ` : ""}${u.nama || "-"}, IG ${
            u.insta || "Kosong"
          }, Tiktok ${u.tiktok || "Kosong"}`,
        );
      });
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      alert("Rekap user berhasil disalin ke clipboard");
    } catch (err) {
      alert("Gagal menyalin rekap user: " + (err.message || err));
    }
  }

  function handleDownloadData() {
    const data = users.map((u) => ({
      Nama: (u.title ? `${u.title} ` : "") + (u.nama || "-"),
      "NRP/NIP": u.user_id || "",
      [columnLabel]: showKesatuanColumn
        ? u.nama_client || u.client_name || u.client || u.nama || "-"
        : u.divisi || "",
      "Username IG": u.insta || "",
      "Username TikTok": u.tiktok || "",
      Status:
        u.status === true || u.status === "true" ? "Aktif" : "Nonaktif",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_directory.xlsx");
  }

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      fetchUsers();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id]);

  const filtered = useMemo(
    () =>
      sortedUsers
        .filter((u) => {
          if (isDitbinmasClient && !showAllDitbinmas) {
            return (
              String(
                u.client_id || u.clientId || u.clientID || u.client || "",
              ).toUpperCase() === "DITBINMAS"
            );
          }
          return true;
        })
        .filter(
          (u) =>
            (u.nama_client || u.nama || "")
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            (u.title || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.user_id || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.divisi || "")
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            (u.insta || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.tiktok || "").toLowerCase().includes(search.toLowerCase()) ||
            String(u.status).toLowerCase().includes(search.toLowerCase()),
        ),
    [sortedUsers, search, isDitbinmasClient, showAllDitbinmas],
  );

  const sorted = filtered;

  // Paging logic menggunakan data yang sudah diurutkan
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset ke halaman 1 saat search berubah
  useEffect(() => setPage(1), [search, setPage]);

  // Pastikan halaman tetap valid saat totalPages berubah
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [page, totalPages, setPage]);

  const day = currentDate.toLocaleDateString("id-ID", { weekday: "long" });
  const dateStr = currentDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = currentDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-md p-8 relative">
        <button
          onClick={fetchUsers}
          className="absolute top-4 right-4 text-black hover:text-black"
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-blue-700">User Directory</h1>
        <div className="mb-4 text-sm text-black">
          Client Name: {clientName || "-"} | {day}, {dateStr} {timeStr}
        </div>
        <div className="flex flex-wrap items-center mb-4 gap-2">
          <button
            onClick={() => {
              setShowForm((s) => !s);
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            {showForm ? "Tutup" : "Tambah User"}
          </button>
          <button
            onClick={handleCopyRekap}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            Rekap User
          </button>
          <button
            onClick={handleDownloadData}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            Download Data
          </button>
          {isDitbinmasClient && (
            <button
              onClick={() => setShowAllDitbinmas((s) => !s)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg text-sm"
            >
              {showAllDitbinmas
                ? "Hanya DITBINMAS"
                : "Semua Ditbinmas"}
            </button>
          )}
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1"
          />
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={pangkat}
              onChange={(e) => setPangkat(e.target.value)}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Pilih Pangkat</option>
              {PANGKAT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="NRP/NIP"
              value={nrpNip}
              onChange={(e) =>
                setNrpNip(e.target.value.replace(/[^0-9]/g, ""))
              }
              inputMode="numeric"
              pattern="\d*"
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={satfung}
              onChange={(e) => {
                setSatfung(e.target.value);
                if (e.target.value !== "POLSEK") setPolsekName("");
              }}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Pilih {columnLabel}</option>
              {SATFUNG_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {satfung === "POLSEK" && (
              <input
                type="text"
                placeholder="Nama Polsek"
                value={polsekName}
                onChange={(e) => setPolsekName(e.target.value)}
                required
                className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300 md:col-span-2"
              />
            )}
            {submitError && (
              <div className="text-red-500 text-sm md:col-span-2">{submitError}</div>
            )}
            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={submitLoading}
                className={`px-4 py-2 rounded-lg text-white text-sm flex-1 ${submitLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {submitLoading ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-2 text-left">No</th>
                <th className="py-2 px-2 text-left">Nama</th>
                <th className="py-2 px-2 text-left">NRP/NIP</th>
                <th className="py-2 px-2 text-left">{columnLabel}</th>
                <th className="py-2 px-2 text-left">Username IG</th>
                <th className="py-2 px-2 text-left">Username TikTok</th>
                <th className="py-2 px-2 text-left">Status</th>
                <th className="py-2 px-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((u, idx) => (
                <tr key={u.user_id || idx} className="border-t">
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="py-1 px-2">
                    {editingRowId === u.user_id ? (
                      <div className="flex gap-1">
                        <input
                          value={editPangkat}
                          onChange={(e) => setEditPangkat(e.target.value)}
                          placeholder="Pangkat"
                          className="w-20 border rounded px-1 text-xs"
                        />
                        <input
                          value={editNama}
                          onChange={(e) => setEditNama(e.target.value)}
                          placeholder="Nama"
                          className="flex-1 border rounded px-1 text-xs"
                        />
                      </div>
                    ) : (
                      (u.title ? `${u.title} ` : "") + (u.nama || "-")
                    )}
                  </td>
                  <td className="py-1 px-2 font-mono">
                    {editingRowId === u.user_id ? (
                      <input
                        value={editNrpNip}
                        onChange={(e) => setEditNrpNip(e.target.value.trim())}
                        placeholder="NRP/NIP"
                        className="w-28 border rounded px-1 text-xs font-mono"
                      />
                    ) : (
                      u.user_id || "-"
                    )}
                  </td>
                  <td className="py-1 px-2">
                    {showKesatuanColumn ? (
                      u.nama_client || u.client_name || u.client || u.nama || "-"
                    ) : editingRowId === u.user_id ? (
                      <input
                        value={editSatfung}
                        onChange={(e) => setEditSatfung(e.target.value)}
                        placeholder={columnLabel}
                        className="border rounded px-1 text-xs"
                      />
                    ) : (
                      u.divisi || "-"
                    )}
                  </td>
                  <td className="py-1 px-2 font-mono text-blue-700">
                    {u.insta ? `@${u.insta}` : "-"}
                  </td>
                  <td className="py-1 px-2 font-mono text-pink-700">{u.tiktok || "-"}</td>
                  <td className="py-1 px-2">
                    {u.status === true || u.status === "true" ? (
                      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs">Aktif</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-gray-200 text-black text-xs">Nonaktif</span>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    {editingRowId === u.user_id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateRow(u.user_id)}
                          disabled={updateLoading}
                          className="text-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingRowId(null)} className="text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(u)} className="text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {editingRowId && updateError && (
                <tr>
                  <td colSpan="8" className="py-1 px-2 text-red-500 text-xs">{updateError}</td>
                </tr>
              )}
              {currentRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-black">
                    Tidak ada pengguna
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paging Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-black font-semibold disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-sm text-black">
              Halaman <b>{page}</b> dari <b>{totalPages}</b>
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-black font-semibold disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
