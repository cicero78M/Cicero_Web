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
import { Pencil, Check, X } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";

const PAGE_SIZE = 50;

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

  // Ambil client_id dan role dari localStorage
  const client_id =
    typeof window !== "undefined"
      ? localStorage.getItem("client_id") || "BOJONEGORO"
      : "BOJONEGORO";
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") || "" : "";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;

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

  const rekapUsers = useMemo(() => {
    const grouped = {};
    users
      .filter((u) => !u.exception)
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
  }, [users, isDitbinmasClient, showAllDitbinmas]);

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
      const trimmedNama = nama.trim();
      const trimmedPangkat = pangkat.trim();
      const trimmedNrpNip = nrpNip.trim();
      const trimmedSatfung = satfung.trim();
      await createUser(token || "", {
        client_id,
        nama: trimmedNama,
        title: trimmedPangkat,
        user_id: trimmedNrpNip,
        divisi: trimmedSatfung,
      });
      setNama("");
      setPangkat("");
      setNrpNip("");
      setSatfung("");
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setSubmitError(err.message || "Gagal menambah user");
    }
    setSubmitLoading(false);
  }

  function handleEditClick(user) {
    setEditingRowId(user.user_id);
    setEditNama((user.nama || "").trim());
    setEditPangkat((user.title || "").trim());
    setEditNrpNip((user.user_id || "").trim());
    setEditSatfung((user.divisi || "").trim());
    setUpdateError("");
  }

  async function handleUpdateRow(userId) {
    setUpdateLoading(true);
    setUpdateError("");
    try {
      const trimmedNama = editNama.trim();
      const trimmedPangkat = editPangkat.trim();
      const trimmedNrpNip = editNrpNip.trim();
      const trimmedSatfung = editSatfung.trim();
      await updateUser(token || "", userId, {
        nama: trimmedNama,
        title: trimmedPangkat,
        divisi: trimmedSatfung,
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

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      fetchUsers();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id]);

  // Filter: tidak tampilkan user dengan exception
  const filtered = useMemo(
    () =>
      users
        .filter((u) => !u.exception)
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
    [users, search, isDitbinmasClient, showAllDitbinmas],
  );

  // Urutkan sehingga pangkat KOMBES POL dan AKBP berada di atas
  const sorted = useMemo(() => {
    const rank = (u) => {
      const t = String(u.title || "").toUpperCase();
      if (t.includes("KOMBES POL")) return 0;
      if (t.includes("AKBP")) return 1;
      return 2;
    };
    return [...filtered].sort((a, b) => rank(a) - rank(b));
  }, [filtered]);

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
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700">User Directory</h1>
        <div className="mb-4 text-sm text-gray-600">
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
          {isDitbinmasClient && (
            <button
              onClick={() => setShowAllDitbinmas((s) => !s)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
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
            onChange={(e) => setNama(e.target.value.trim())}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder="Pangkat"
              value={pangkat}
            onChange={(e) => setPangkat(e.target.value.trim())}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder="NRP/NIP"
              value={nrpNip}
            onChange={(e) => setNrpNip(e.target.value.trim())}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder={columnLabel}
              value={satfung}
              onChange={(e) => setSatfung(e.target.value.trim())}
              required
              className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
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
                          onChange={(e) => setEditPangkat(e.target.value.trim())}
                          placeholder="Pangkat"
                          className="w-20 border rounded px-1 text-xs"
                        />
                        <input
                          value={editNama}
                          onChange={(e) => setEditNama(e.target.value.trim())}
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
                        onChange={(e) => setEditSatfung(e.target.value.trim())}
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
                      <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">Nonaktif</span>
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
                  <td colSpan="8" className="py-4 text-center text-gray-500">
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
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Halaman <b>{page}</b> dari <b>{totalPages}</b>
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
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
