/**
 * Menstandarkan penentuan status pelaksanaan engagement per pengguna.
 *
 * Aturan standar:
 * - Jika target konten 0 atau tidak valid, status dianggap "belum" karena belum ada pelaksanaan yang bisa dinilai.
 * - Jika jumlah aksi yang dilakukan >= target konten, status "sudah".
 * - Jika ada aksi tetapi belum memenuhi target, status "kurang".
 * - Jika belum ada aksi sama sekali, status "belum".
 *
 * Hitungan `completed` akan selalu dikunci ke nilai target agar tidak pernah melebihi
 * jumlah tugas yang seharusnya diselesaikan.
 */
export function getEngagementStatus({
  completed,
  totalTarget,
}: {
  completed: number;
  totalTarget: number;
}) {
  const normalizedTarget = Math.max(0, Number(totalTarget) || 0);
  const normalizedCompleted = clampEngagementCompleted({ completed, totalTarget });

  if (normalizedTarget <= 0) return "belum";
  if (normalizedCompleted >= normalizedTarget) return "sudah";
  if (normalizedCompleted > 0) return "kurang";
  return "belum";
}

/**
 * Membatasi jumlah aksi yang dicatat agar tidak melebihi target tugas.
 * Berguna untuk menormalkan angka pelaksanaan yang mungkin berlebih ketika
 * sumber data menghitung lebih dari satu interaksi per tugas.
 */
export function clampEngagementCompleted({
  completed,
  totalTarget,
}: {
  completed: number;
  totalTarget: number;
}) {
  const normalizedTarget = Math.max(0, Number(totalTarget) || 0);
  const normalizedCompleted = Math.max(0, Number(completed) || 0);

  if (normalizedTarget === 0) return 0;

  return Math.min(normalizedCompleted, normalizedTarget);
}

export type EngagementStatus = ReturnType<typeof getEngagementStatus>;
