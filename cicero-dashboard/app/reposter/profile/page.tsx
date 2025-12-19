import ReposterFrame from "../ReposterFrame";

export default function ReposterProfilePage() {
  return (
    <ReposterFrame
      title="Profil pengguna Reposter"
      description="Halaman ini menampilkan profil pengguna reposter dengan endpoint yang kompatibel dengan pegiat_medsos_app agar data akun konsisten di mobile dan web."
      path="/profile"
      iframeTitle="Reposter - Profil"
    />
  );
}
