/**
 * Menstandarkan penentuan status pelaksanaan engagement per pengguna.
 *
 * Aturan standar:
 * - Jika target konten 0 atau tidak valid, status dianggap "belum" karena belum ada pelaksanaan yang bisa dinilai.
 * - Jika jumlah aksi yang dilakukan >= target konten, status "sudah".
 * - Jika ada aksi tetapi belum memenuhi target, status "kurang".
 * - Jika belum ada aksi sama sekali, status "belum".
 */
export function getEngagementStatus({
  completed,
  totalTarget,
}: {
  completed: number;
  totalTarget: number;
}) {
  const normalizedTarget = Number(totalTarget) || 0;
  const normalizedCompleted = Number(completed) || 0;

  if (normalizedTarget <= 0) return "belum";
  if (normalizedCompleted >= normalizedTarget) return "sudah";
  if (normalizedCompleted > 0) return "kurang";
  return "belum";
}

export type EngagementStatus = ReturnType<typeof getEngagementStatus>;
