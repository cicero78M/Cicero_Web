import ReposterShell from "../../../../ReposterShell";
import ReportLinksClient from "../../../ReportLinksClient";

export default function ReposterReportLinksPage() {
  return (
    <ReposterShell
      title="Laporan Reposter"
      description="Menampilkan tautan laporan per platform untuk tugas official."
    >
      <ReportLinksClient />
    </ReposterShell>
  );
}
