"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { showToast } from "@/utils/showToast";
import { uploadTugasKhusus } from "@/utils/api";

export default function UploadTugasKhususForm({ token, clientId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type (CSV, Excel, or JSON)
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
    ];
    
    const validExtensions = [".csv", ".xls", ".xlsx", ".json"];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      showToast("Format file tidak valid. Harap upload file CSV, Excel, atau JSON.", "error");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      showToast("Ukuran file terlalu besar. Maksimal 10MB.", "error");
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast("Pilih file terlebih dahulu.", "warning");
      return;
    }

    if (!token || !clientId) {
      showToast("Token atau Client ID tidak ditemukan. Silakan login ulang.", "error");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadTugasKhusus(token, clientId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      showToast("File berhasil diupload!", "success");
      
      // Reset form
      handleRemoveFile();
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast(
        error?.message || "Gagal mengupload file. Silakan coba lagi.",
        "error"
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Upload Tugas Khusus</h2>
        <p className="text-sm text-slate-600">
          Upload file berisi data tugas khusus untuk amplifikasi. File yang didukung: CSV, Excel (.xlsx, .xls), atau JSON.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 transition-all hover:border-indigo-400 hover:bg-indigo-50/50"
          >
            <Upload className="mb-4 h-12 w-12 text-slate-400 transition-colors group-hover:text-indigo-500" />
            <p className="mb-1 text-sm font-semibold text-slate-700">
              Klik untuk memilih file
            </p>
            <p className="text-xs text-slate-500">
              atau drag & drop file ke area ini
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Format: CSV, Excel, JSON (Max: 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx,.json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                  {uploadProgress === 100 && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Upload berhasil!</span>
                    </div>
                  )}
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={handleRemoveFile}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Format Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="space-y-2 text-sm text-blue-900">
            <p className="font-semibold">Format File Yang Diharapkan:</p>
            <ul className="ml-4 space-y-1 list-disc text-blue-800">
              <li>
                <strong>CSV/Excel:</strong> Kolom wajib: judul, deskripsi, link_konten, tanggal_mulai, tanggal_selesai
              </li>
              <li>
                <strong>JSON:</strong> Array objek dengan field: title, description, content_link, start_date, end_date
              </li>
              <li>Format tanggal: YYYY-MM-DD (contoh: 2024-01-15)</li>
              <li>Link konten harus berupa URL lengkap dan valid</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Data */}
      <details className="rounded-xl border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900">
          Lihat Contoh Format CSV
        </summary>
        <div className="border-t border-slate-200 p-4">
          <pre className="overflow-x-auto rounded-lg bg-slate-800 p-4 text-xs text-slate-100">
{`judul,deskripsi,link_konten,tanggal_mulai,tanggal_selesai
Kampanye HUT RI,Amplifikasi konten HUT RI ke-78,https://instagram.com/p/abc123,2024-08-01,2024-08-17
Sosialisasi Vaksin,Kampanye awareness vaksinasi,https://instagram.com/p/def456,2024-09-01,2024-09-30`}
          </pre>
        </div>
      </details>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {uploading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Upload File</span>
            </>
          )}
        </button>
        
        {file && !uploading && (
          <button
            onClick={handleRemoveFile}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            Batalkan
          </button>
        )}
      </div>

      {/* Additional Info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          <strong>Catatan:</strong> Setelah upload berhasil, data tugas khusus akan diproses oleh sistem. 
          Anda dapat memantau progres amplifikasi melalui tab "Dashboard Insight" dan "Rekap Detail".
          File yang diupload akan divalidasi terlebih dahulu sebelum disimpan ke database.
        </p>
      </div>
    </div>
  );
}
