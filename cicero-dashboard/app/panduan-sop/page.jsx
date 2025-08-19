export const metadata = {
  title: "Panduan & SOP",
  description: "Dokumentasi panduan untuk pengembangan frontend dan backend.",
};

export default function PanduanSOPPage() {
  const sections = [
    {
      title: "Panduan Pengembangan Frontend",
      content: (
        <div className="space-y-2">
          <p>
            Repo: <a href="https://github.com/cicero78M/Cicero_Web" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Cicero_Web</a>
          </p>
          <p>Langkah memulai:</p>
          <pre className="bg-gray-100 p-2 rounded"><code>npm install
npm run dev</code></pre>
          <p>Dokumentasi:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://github.com/cicero78M/Cicero_Web/blob/main/docs/DEPLOYMENT.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Deployment</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_Web/blob/main/docs/executive_summary.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Ringkasan Eksekutif</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_Web/blob/main/docs/google_auth_policies.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Kebijakan Google Auth</a></li>
          </ul>
        </div>
      ),
    },
    {
      title: "Panduan Pengembangan Backend",
      content: (
        <div className="space-y-2">
          <p>
            Repo: <a href="https://github.com/cicero78M/Cicero_V2" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Cicero_V2</a>
          </p>
          <p>Persyaratan: Node.js 20+, PostgreSQL, dan Redis.</p>
          <p>Langkah memulai:</p>
          <pre className="bg-gray-100 p-2 rounded"><code>npm install
npm start</code></pre>
          <p>Dokumentasi terkait:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://github.com/cicero78M/Cicero_V2/blob/main/docs/combined_overview.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Gambaran Kombinasi</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_V2/blob/main/docs/enterprise_architecture.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Arsitektur Enterprise</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_V2/blob/main/docs/workflow_usage_guide.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Alur Kerja</a></li>
          </ul>
        </div>
      ),
    },
    {
      title: "Panduan Registrasi User Dashboard",
      content: (
        <div className="space-y-2">
          <p>Langkah registrasi pengguna untuk mengakses dashboard:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Buka halaman dashboard dan pilih "Daftar".</li>
            <li>Isi formulir registrasi dengan data yang diperlukan.</li>
            <li>Verifikasi akun melalui tautan yang dikirimkan ke email.</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Panduan Update Data via WA Bot",
      content: (
        <div className="space-y-2">
          <p>Petunjuk memperbarui data menggunakan bot WhatsApp:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Simpan nomor bot WA ke kontak.</li>
            <li>Kirim pesan dengan format yang telah ditentukan.</li>
            <li>Tunggu konfirmasi bahwa data berhasil diperbarui.</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Panduan Operator Update, Rekap, dan Absensi",
      content: (
        <div className="space-y-2">
          <p>Langkah bagi operator untuk memperbarui, merekap, dan mencatat absensi:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Masuk ke dashboard operator.</li>
            <li>Lakukan pembaruan data dan rekap sesuai periode.</li>
            <li>Catat absensi harian pada menu yang tersedia.</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Panduan Penggunaan Chart Visualisasi Data",
      content: (
        <div className="space-y-2">
          <p>Cara membaca dan memanfaatkan chart visualisasi:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Pilih jenis chart pada menu analitik.</li>
            <li>Gunakan filter untuk menyesuaikan data yang ditampilkan.</li>
            <li>Unduh chart bila diperlukan untuk laporan.</li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Panduan & SOP</h1>
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <details key={idx} className="group border rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-lg flex justify-between items-center">
              {section.title}
              <span className="transition-transform group-open:rotate-90">▸</span>
            </summary>
            <div className="mt-2">{section.content}</div>
          </details>
        ))}
      </div>
    </main>
  );
}

