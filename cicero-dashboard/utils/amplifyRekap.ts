export type AmplifyRekapSummary = {
  totalUser?: number;
  totalSudahPost?: number;
  totalBelumPost?: number;
  totalLink?: number;
};

type AmplifyRekapOptions = {
  clientName?: string;
  periodeLabel?: string;
  viewLabel?: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const formatNumber = (value?: number) =>
  numberFormatter.format(Number(value) || 0);

export function buildAmplifyRekap(
  summary: AmplifyRekapSummary,
  { clientName, periodeLabel, viewLabel }: AmplifyRekapOptions = {},
) {
  const totalUser = Number(summary?.totalUser) || 0;
  const totalSudahPost = Number(summary?.totalSudahPost) || 0;
  const totalBelumPost = Number(summary?.totalBelumPost) || 0;
  const totalLink = Number(summary?.totalLink) || 0;
  const completionRate = totalUser
    ? `${Math.round((totalSudahPost / totalUser) * 100)}%`
    : "-";

  const headerLines = ["Rekap Amplifikasi Link Insight"];
  if (clientName) {
    headerLines.push(`Client: ${clientName}`);
  }
  if (periodeLabel) {
    headerLines.push(
      `Periode: ${periodeLabel}${viewLabel ? ` (${viewLabel})` : ""}`,
    );
  }

  return [
    ...headerLines,
    "",
    `Total Link Amplifikasi: ${formatNumber(totalLink)}`,
    `Total User: ${formatNumber(totalUser)}`,
    `Sudah Post: ${formatNumber(totalSudahPost)}`,
    `Belum Post: ${formatNumber(totalBelumPost)}`,
    `Kepatuhan: ${completionRate}`,
  ].join("\n");
}
