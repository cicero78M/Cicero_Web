export const metadata = {
  title: "Kebijakan Privasi",
  description: "Penjelasan cara kami menangani data Google Authentication."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 prose">
      <h1>Kebijakan Privasi</h1>
      <p>
        Cicero Dashboard menggunakan Google Authentication untuk proses log in.
        Saat Anda menyetujui permintaan akses, kami hanya memperoleh nama,
        alamat email, dan ID Google Anda.
      </p>
      <p>
        Informasi tersebut tidak disimpan untuk keperluan lain selain
        autentikasi. Kami tidak membagikan data ke pihak ketiga dan tidak
        menggunakannya untuk iklan.
      </p>
      <p>
        Anda dapat meminta penghapusan akun dengan menghubungi administrator.
        Seluruh data Google yang tersimpan akan dihapus.
      </p>
    </main>
  );
}
