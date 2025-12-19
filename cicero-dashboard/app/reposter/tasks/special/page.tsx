import ReposterShell from "../../ReposterShell";
import ReposterTaskList from "../ReposterTaskList";

export default function ReposterSpecialTasksPage() {
  return (
    <ReposterShell
      title="Tugas Khusus Reposter"
      description="Memuat tugas khusus dan kampanye tematik agar pelaksanaan di reposter lebih terarah."
    >
      <ReposterTaskList taskType="special" />
    </ReposterShell>
  );
}
