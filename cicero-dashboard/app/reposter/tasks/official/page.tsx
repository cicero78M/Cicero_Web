import ReposterShell from "../../ReposterShell";
import ReposterTaskList from "../ReposterTaskList";

export default function ReposterOfficialTasksPage() {
  return (
    <ReposterShell
      title="Tugas Official Reposter"
      description="Menampilkan daftar tugas official yang dipantau untuk kebutuhan reposter."
    >
      <ReposterTaskList taskType="official" />
    </ReposterShell>
  );
}
