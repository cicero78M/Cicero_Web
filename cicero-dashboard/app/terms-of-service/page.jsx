export const metadata = {
  title: "Ketentuan Layanan",
  description: "Ketentuan penggunaan Cicero Dashboard dengan Google Auth."
};

export default function TermsOfServicePage() {
  return (
    <main className="max-w-3xl mx-auto p-6 prose">
      <h1>Ketentuan Layanan</h1>
      <p>
        Cicero Dashboard menyediakan fitur masuk menggunakan akun Google. Informasi
        yang diterima berupa nama, alamat email dan ID Google Anda. Data
        tersebut dipakai semata-mata untuk memverifikasi identitas dan
        memberikan akses ke dashboard.
      </p>
      <p>
        Kami tidak membagikan data Google Anda ke pihak mana pun. Pengguna wajib
        menjaga kerahasiaan kredensial. Pelanggaran atau penyalahgunaan layanan
        dapat berakibat penghentian akses.
      </p>
      <p>Hubungi admin bila ada pertanyaan seputar ketentuan ini.</p>
    </main>
  );
}
