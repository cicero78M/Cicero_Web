export const metadata = {
  title: "Panduan & SOP",
  description: "Dokumentasi panduan untuk pengembangan frontend dan backend.",
};

export default function PanduanSOPPage() {
  const sections = [
    {
      title: "Panduan Frontend",
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
            <li><a href="https://github.com/cicero78M/Cicero_Web/blob/main/docs/executive_summary.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Executive Summary</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_Web/blob/main/docs/google_auth_policies.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Kebijakan Google Auth</a></li>
          </ul>
        </div>
      ),
    },
    {
      title: "Panduan Backend",
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
            <li><a href="https://github.com/cicero78M/Cicero_V2/blob/main/docs/combined_overview.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Gambaran Kombinasi</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_V2/blob/main/docs/enterprise_architecture.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Arsitektur Enterprise</a></li>
            <li><a href="https://github.com/cicero78M/Cicero_V2/blob/main/docs/workflow_usage_guide.md" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Panduan Alur Kerja</a></li>
          </ul>
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

