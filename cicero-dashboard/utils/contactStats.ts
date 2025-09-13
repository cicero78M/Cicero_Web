export interface ContactStats {
  instagramFilled: number;
  instagramEmpty: number;
  tiktokFilled: number;
  tiktokEmpty: number;
}

export function accumulateContactStats(
  target: ContactStats,
  hasIG: boolean,
  hasTT: boolean,
): void {
  if (hasIG) target.instagramFilled += 1;
  else target.instagramEmpty += 1;

  if (hasTT) target.tiktokFilled += 1;
  else target.tiktokEmpty += 1;
}
