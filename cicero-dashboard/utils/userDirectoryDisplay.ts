type GenericUser = Record<string, any>;

export function getUserPolres(user?: GenericUser): string {
  if (!user) return "";
  return (
    user.nama_polres ||
    user.namaPolres ||
    user.polres ||
    user.polres_name ||
    user.client_name ||
    user.clientName ||
    user.nama_client ||
    user.client_label ||
    ""
  );
}

export function getUserJabatan(user?: GenericUser): string {
  if (!user) return "";
  return (
    user.jabatan ||
    user.nama_jabatan ||
    user.namaJabatan ||
    user.position ||
    user.title_jabatan ||
    user.job_title ||
    ""
  );
}

