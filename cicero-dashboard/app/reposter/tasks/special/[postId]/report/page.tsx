import ReposterShell from "../../../../ReposterShell";
import ReportLinksClient from "../../../ReportLinksClient";

export default function ReposterSpecialReportLinksPage() {
  return (
    <ReposterShell
      title="Laporan Tugas Khusus"
      description="Menampilkan tautan laporan per platform untuk tugas khusus."
    >
      <ReportLinksClient isSpecial />
    </ReposterShell>
  );
}
