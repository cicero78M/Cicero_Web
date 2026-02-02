# Upload Tugas Khusus - Backend Implementation Guide

## Overview

Halaman amplifikasi tugas khusus kini memiliki tab "Upload Tugas Khusus" yang memungkinkan pengguna mengunggah data tugas khusus dalam format CSV, Excel, atau JSON.

## Frontend Implementation

### New Components

1. **`UploadTugasKhususForm.jsx`** - Form komponen untuk upload file
   - Lokasi: `cicero-dashboard/components/UploadTugasKhususForm.jsx`
   - Fitur:
     - File selection dengan drag & drop support
     - Validasi file type (CSV, Excel, JSON)
     - Validasi file size (max 10MB)
     - Upload progress indicator
     - Success/error handling
     - Format contoh dan petunjuk penggunaan

2. **Modified `AmplifyKhususInsightView.jsx`**
   - Menambahkan tab "Upload" ke halaman amplifikasi khusus
   - Integrasi dengan `UploadTugasKhususForm`
   - Auto-refresh data setelah upload berhasil

3. **Modified `tabs.js`**
   - Menambahkan `AMPLIFY_KHUSUS_TABS` yang include tab "Upload"
   - Icon: Upload (lucide-react)

### API Integration

**Function:** `uploadTugasKhusus(token, clientId, file)`
- Lokasi: `cicero-dashboard/utils/api.ts`
- Method: POST
- Content-Type: multipart/form-data
- Payload:
  - `file`: File object (CSV, Excel, atau JSON)
  - `client_id`: String - Client identifier

**Endpoint Candidates:**
The frontend tries these endpoints in order:
1. `POST /api/tasks/special/upload`
2. `POST /api/amplify/upload-khusus`

## Backend Requirements

### Required Endpoint

Backend harus mengimplementasikan salah satu dari endpoint berikut:

**Option 1: `/api/tasks/special/upload`** (Recommended)
**Option 2: `/api/amplify/upload-khusus`**

### Request Format

**Method:** POST  
**Content-Type:** multipart/form-data  
**Authentication:** Bearer token in Authorization header

**Form Data:**
```
file: <File object>
client_id: <string>
```

### Expected File Formats

#### CSV/Excel Format
Kolom wajib (header row required):
- `judul` - Judul tugas khusus (string, required)
- `deskripsi` - Deskripsi tugas (string, optional)
- `link_konten` - URL konten yang akan diamplifikasi (string, required, valid URL)
- `tanggal_mulai` - Tanggal mulai tugas (string, format: YYYY-MM-DD, required)
- `tanggal_selesai` - Tanggal selesai tugas (string, format: YYYY-MM-DD, required)

**Contoh CSV:**
```csv
judul,deskripsi,link_konten,tanggal_mulai,tanggal_selesai
Kampanye HUT RI,Amplifikasi konten HUT RI ke-78,https://instagram.com/p/abc123,2024-08-01,2024-08-17
Sosialisasi Vaksin,Kampanye awareness vaksinasi,https://instagram.com/p/def456,2024-09-01,2024-09-30
```

#### JSON Format
Array of objects dengan fields:
- `title` atau `judul` - Judul tugas (string, required)
- `description` atau `deskripsi` - Deskripsi tugas (string, optional)
- `content_link` atau `link_konten` - URL konten (string, required, valid URL)
- `start_date` atau `tanggal_mulai` - Tanggal mulai (string, YYYY-MM-DD, required)
- `end_date` atau `tanggal_selesai` - Tanggal selesai (string, YYYY-MM-DD, required)

**Contoh JSON:**
```json
[
  {
    "title": "Kampanye HUT RI",
    "description": "Amplifikasi konten HUT RI ke-78",
    "content_link": "https://instagram.com/p/abc123",
    "start_date": "2024-08-01",
    "end_date": "2024-08-17"
  },
  {
    "title": "Sosialisasi Vaksin",
    "description": "Kampanye awareness vaksinasi",
    "content_link": "https://instagram.com/p/def456",
    "start_date": "2024-09-01",
    "end_date": "2024-09-30"
  }
]
```

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "File berhasil diupload dan diproses",
  "data": {
    "uploaded_count": 2,
    "tasks": [
      {
        "id": "task_123",
        "title": "Kampanye HUT RI",
        "status": "created"
      },
      {
        "id": "task_124",
        "title": "Sosialisasi Vaksin",
        "status": "created"
      }
    ]
  }
}
```

#### Error Responses

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "row": 2,
      "field": "link_konten",
      "message": "Invalid URL format"
    }
  ]
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Token tidak valid atau sudah kadaluarsa"
}
```

**413 Payload Too Large** - File too large
```json
{
  "success": false,
  "message": "Ukuran file melebihi batas maksimal (10MB)"
}
```

**415 Unsupported Media Type** - Invalid file type
```json
{
  "success": false,
  "message": "Format file tidak didukung. Gunakan CSV, Excel, atau JSON"
}
```

**500 Internal Server Error** - Server error
```json
{
  "success": false,
  "message": "Terjadi kesalahan saat memproses file"
}
```

## Backend Implementation Example (Node.js/Express)

```javascript
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung'));
    }
  },
});

// Middleware untuk validasi token (sesuaikan dengan sistem auth Anda)
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan',
    });
  }
  // Validasi token dan set req.user
  // ...
  next();
};

// Upload endpoint
router.post('/api/tasks/special/upload', 
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      const { client_id } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'File tidak ditemukan',
        });
      }

      if (!client_id) {
        return res.status(400).json({
          success: false,
          message: 'client_id wajib diisi',
        });
      }

      // Parse file based on type
      let tasks = [];
      const filePath = file.path;

      if (file.mimetype === 'text/csv') {
        // Parse CSV
        tasks = await parseCSV(filePath);
      } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
        // Parse Excel
        tasks = parseExcel(filePath);
      } else if (file.mimetype === 'application/json') {
        // Parse JSON
        const content = fs.readFileSync(filePath, 'utf-8');
        tasks = JSON.parse(content);
      }

      // Validate and normalize tasks
      const validatedTasks = validateTasks(tasks);

      // Save to database
      const savedTasks = await saveTasks(validatedTasks, client_id, req.user);

      // Cleanup uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'File berhasil diupload dan diproses',
        data: {
          uploaded_count: savedTasks.length,
          tasks: savedTasks,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Cleanup file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Gagal memproses file',
      });
    }
  }
);

// Helper functions
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const tasks = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        tasks.push({
          title: row.judul || row.title,
          description: row.deskripsi || row.description,
          content_link: row.link_konten || row.content_link,
          start_date: row.tanggal_mulai || row.start_date,
          end_date: row.tanggal_selesai || row.end_date,
        });
      })
      .on('end', () => resolve(tasks))
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  return data.map(row => ({
    title: row.judul || row.title,
    description: row.deskripsi || row.description,
    content_link: row.link_konten || row.content_link,
    start_date: row.tanggal_mulai || row.start_date,
    end_date: row.tanggal_selesai || row.end_date,
  }));
}

function validateTasks(tasks) {
  const errors = [];
  
  tasks.forEach((task, index) => {
    const row = index + 2; // +2 for header and 0-indexing
    
    if (!task.title) {
      errors.push({
        row,
        field: 'title',
        message: 'Judul wajib diisi',
      });
    }
    
    if (!task.content_link) {
      errors.push({
        row,
        field: 'content_link',
        message: 'Link konten wajib diisi',
      });
    } else if (!isValidURL(task.content_link)) {
      errors.push({
        row,
        field: 'content_link',
        message: 'Format URL tidak valid',
      });
    }
    
    if (!task.start_date || !isValidDate(task.start_date)) {
      errors.push({
        row,
        field: 'start_date',
        message: 'Tanggal mulai tidak valid (gunakan format YYYY-MM-DD)',
      });
    }
    
    if (!task.end_date || !isValidDate(task.end_date)) {
      errors.push({
        row,
        field: 'end_date',
        message: 'Tanggal selesai tidak valid (gunakan format YYYY-MM-DD)',
      });
    }
  });
  
  if (errors.length > 0) {
    const error = new Error('Validation error');
    error.errors = errors;
    throw error;
  }
  
  return tasks;
}

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

async function saveTasks(tasks, clientId, user) {
  // Implement database save logic here
  // This is just an example - adapt to your database schema
  const savedTasks = [];
  
  for (const task of tasks) {
    const saved = await db.specialTasks.create({
      title: task.title,
      description: task.description,
      content_link: task.content_link,
      start_date: task.start_date,
      end_date: task.end_date,
      client_id: clientId,
      created_by: user.id,
      status: 'pending',
    });
    
    savedTasks.push({
      id: saved.id,
      title: saved.title,
      status: 'created',
    });
  }
  
  return savedTasks;
}

module.exports = router;
```

## Security Considerations

1. **Authentication**: Semua request harus diautentikasi dengan token valid
2. **File Size Limit**: Maksimal 10MB untuk mencegah DoS
3. **File Type Validation**: Hanya accept CSV, Excel, dan JSON
4. **Input Validation**: Validasi semua field sebelum save ke database
5. **SQL Injection Prevention**: Gunakan parameterized queries
6. **XSS Prevention**: Sanitize input sebelum display
7. **File Cleanup**: Hapus uploaded file setelah processing
8. **Rate Limiting**: Implementasi rate limiting untuk prevent abuse

## Database Schema Recommendation

```sql
CREATE TABLE special_tasks (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_link VARCHAR(1000) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  INDEX idx_client_id (client_id),
  INDEX idx_dates (start_date, end_date),
  INDEX idx_status (status)
);
```

## Testing Checklist

- [ ] Upload CSV file dengan data valid
- [ ] Upload Excel file (.xlsx) dengan data valid
- [ ] Upload JSON file dengan data valid
- [ ] Validasi file size limit (> 10MB should fail)
- [ ] Validasi file type (PDF, etc should fail)
- [ ] Validasi data kosong
- [ ] Validasi format tanggal invalid
- [ ] Validasi URL invalid
- [ ] Upload tanpa authentication (should fail)
- [ ] Upload dengan token expired (should fail)
- [ ] Check data tersimpan di database dengan benar
- [ ] Check auto-refresh di frontend setelah upload berhasil

## Integration with Existing System

Upload tugas khusus ini terintegrasi dengan:
1. **Amplification Insight** - Data yang diupload akan muncul di dashboard insight
2. **Rekap Detail** - Data akan tersedia di tabel rekap detail
3. **API `/api/amplify/rekap-khusus`** - Endpoint existing akan return data dari upload

Pastikan data struktur yang disimpan compatible dengan yang di-expect oleh endpoint rekap existing.

## Future Enhancements

1. **Bulk Validation Before Upload**: Validasi file di frontend sebelum upload
2. **Template Download**: Menyediakan template CSV/Excel untuk download
3. **Import History**: Track upload history dan rollback capability
4. **Duplicate Detection**: Deteksi dan prevent duplicate tasks
5. **Scheduled Tasks**: Support untuk schedule task di masa depan
6. **Batch Processing**: Process large files secara asynchronous
7. **Progress Tracking**: Real-time progress untuk large uploads
8. **Export Functionality**: Export existing tasks ke CSV/Excel

## Support

Untuk pertanyaan atau issues terkait upload feature:
1. Check error message di browser console
2. Check backend logs untuk detailed error
3. Verify file format sesuai spesifikasi
4. Verify backend endpoint sudah diimplementasikan

## Change Log

### Version 1.0.0 (2024-02-02)
- Initial implementation of upload tugas khusus feature
- Support untuk CSV, Excel, dan JSON formats
- File validation dan error handling
- Integration dengan amplifikasi khusus page
- Documentation dan backend implementation guide
