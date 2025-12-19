import ReposterShell from "../ReposterShell";
import ProfileClient from "./ProfileClient";

export default function ReposterProfilePage() {
  return (
    <ReposterShell
      title="Profil pengguna Reposter"
      description="Halaman ini menampilkan profil pengguna reposter agar data akun selalu sesuai dengan sesi login yang aktif."
    >
      <ProfileClient />
    </ReposterShell>
  );
}
