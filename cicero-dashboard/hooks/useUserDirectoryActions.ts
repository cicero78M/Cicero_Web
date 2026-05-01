import { createUser, updateUser, updateUserRoles } from "@/utils/api";
import { showToast } from "@/utils/showToast";
import { validateNewUser } from "@/utils/validateUserForm";

type User = Record<string, any>;

export function useUserDirectoryActions(params: {
  token?: string;
  clientId?: string;
  clientName?: string;
  rekapFilteredUsers: User[];
  mutate: () => Promise<any>;
  submitForm: {
    nama: string;
    pangkat: string;
    nrpNip: string;
    satfung: string;
    polsekName: string;
  };
  editForm: {
    editNama: string;
    editPangkat: string;
    editNrpNip: string;
    editSatfung: string;
  };
  deactivateForm: {
    deactivateTarget: User | null;
    confirmNrpInput: string;
  };
  setters: {
    setSubmitError: (v: string) => void;
    setSubmitLoading: (v: boolean) => void;
    setNama: (v: string) => void;
    setPangkat: (v: string) => void;
    setNrpNip: (v: string) => void;
    setSatfung: (v: string) => void;
    setPolsekName: (v: string) => void;
    setShowForm: (v: boolean) => void;
    setUpdateLoading: (v: boolean) => void;
    setUpdateError: (v: string) => void;
    setEditingRowId: (v: string | null) => void;
    setDeactivateLoading: (v: boolean) => void;
    setDeactivateError: (v: string) => void;
    setToggleStatusLoadingId: (v: string | null) => void;
    closeDeactivateModal: () => void;
  };
}) {
  const {
    token,
    clientId,
    clientName,
    rekapFilteredUsers,
    mutate,
    submitForm,
    editForm,
    deactivateForm,
    setters,
  } = params;

  async function handleSubmit(e: any) {
    e.preventDefault();
    setters.setSubmitError("");
    setters.setSubmitLoading(true);
    try {
      const { error: validationError, nrpNip: sanitizedNrpNip, satfungValue } =
        validateNewUser(submitForm);
      if (validationError) throw new Error(validationError);
      await createUser(token || "", {
        client_id: clientId,
        nama: submitForm.nama,
        title: submitForm.pangkat,
        user_id: sanitizedNrpNip,
        divisi: satfungValue,
      });
      setters.setNama("");
      setters.setPangkat("");
      setters.setNrpNip("");
      setters.setSatfung("");
      setters.setPolsekName("");
      setters.setShowForm(false);
      showToast("User berhasil ditambahkan", "success");
      await mutate();
    } catch (err: any) {
      setters.setSubmitError(err.message || "Gagal menambah user");
    }
    setters.setSubmitLoading(false);
  }

  async function handleUpdateRow(userId: string) {
    setters.setUpdateLoading(true);
    setters.setUpdateError("");
    try {
      const sanitizedNrpNip = editForm.editNrpNip.replace(/\D/g, "");
      if (!sanitizedNrpNip) throw new Error("NRP/NIP wajib diisi");
      await updateUser(token || "", userId, {
        nama: editForm.editNama,
        title: editForm.editPangkat,
        divisi: editForm.editSatfung,
        user_id: sanitizedNrpNip,
      });
      if (userId !== sanitizedNrpNip) {
        await updateUserRoles(token || "", userId, sanitizedNrpNip);
      }
      await mutate();
      setters.setEditingRowId(null);
      showToast("Data user berhasil diperbarui", "success");
    } catch (err: any) {
      setters.setUpdateError(err.message || "Gagal mengubah user");
    }
    setters.setUpdateLoading(false);
  }

  async function handleConfirmDeactivate() {
    const targetId = String(deactivateForm.deactivateTarget?.user_id || "").replace(/\D/g, "");
    const normalizedInput = deactivateForm.confirmNrpInput.replace(/\D/g, "");
    if (!normalizedInput) {
      setters.setDeactivateError("NRP/NIP wajib diisi untuk konfirmasi.");
      return;
    }
    if (normalizedInput !== targetId) {
      setters.setDeactivateError("NRP/NIP tidak cocok dengan user yang dipilih.");
      return;
    }
    setters.setDeactivateLoading(true);
    setters.setDeactivateError("");
    try {
      await updateUser(token || "", deactivateForm.deactivateTarget?.user_id, { status: false });
      await mutate();
      showToast("User berhasil dinonaktifkan", "success");
      setters.closeDeactivateModal();
    } catch (err: any) {
      setters.setDeactivateError(err.message || "Gagal menonaktifkan user");
    }
    setters.setDeactivateLoading(false);
  }

  async function handleActivateUser(user: User) {
    setters.setToggleStatusLoadingId(user.user_id);
    try {
      await updateUser(token || "", user.user_id, { status: true });
      await mutate();
      showToast("User berhasil diaktifkan kembali", "success");
    } catch (err: any) {
      showToast(err.message || "Gagal mengaktifkan user", "error");
    }
    setters.setToggleStatusLoadingId(null);
  }

  async function handleCopyRekap() {
    const now = new Date();
    const day = now.toLocaleDateString("id-ID", { weekday: "long" });
    const date = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const allUsers = rekapFilteredUsers;
    const totalUser = allUsers.length;
    const totalUpdateIG = allUsers.filter((u) => u.insta).length;
    const totalUpdateTiktok = allUsers.filter((u) => u.tiktok).length;
    const totalBelumUpdate = allUsers.filter((u) => !u.insta && !u.tiktok).length;

    const groupedByDivisi: Record<string, User[]> = {};
    allUsers.forEach((u) => {
      const key = u.divisi || "-";
      if (!groupedByDivisi[key]) groupedByDivisi[key] = [];
      groupedByDivisi[key].push(u);
    });

    const lines: string[] = [
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
    Object.entries(groupedByDivisi).forEach(([sf, list]) => {
      lines.push(`*${sf}*`);
      list.forEach((u) => {
        lines.push(`${u.title ? `${u.title} ` : ""}${u.nama || "-"}, IG ${u.insta || "Kosong"}, Tiktok ${u.tiktok || "Kosong"}`);
      });
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("Rekap user berhasil disalin ke clipboard", "success");
    } catch (err: any) {
      showToast("Gagal menyalin rekap user: " + (err.message || err), "error");
    }
  }

  return {
    handleSubmit,
    handleUpdateRow,
    handleConfirmDeactivate,
    handleActivateUser,
    handleCopyRekap,
  };
}

