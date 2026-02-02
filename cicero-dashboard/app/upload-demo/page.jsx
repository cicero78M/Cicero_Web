"use client";

import UploadTugasKhususForm from "@/components/UploadTugasKhususForm";

export default function UploadTestPage() {
  const handleUploadSuccess = () => {
    console.log("Upload successful");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-center text-3xl font-bold text-slate-800">
          Upload Tugas Khusus - Demo
        </h1>
        <UploadTugasKhususForm
          token="demo-token"
          clientId="demo-client"
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
}
