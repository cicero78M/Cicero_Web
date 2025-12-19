# Endpoint Tugas (Official & Special)

Dokumen ini menjelaskan endpoint tugas untuk menyamai perilaku `pegiat_medsos_app`
serta cara memanggilnya dari dashboard/reposter.

## Ringkasan Endpoint

| Endpoint | Deskripsi | Token |
| --- | --- | --- |
| `GET /api/tasks/official` | Daftar tugas official | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `GET /api/tasks/special` | Daftar tugas khusus | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `GET /api/insta/posts` | Daftar postingan official (reposter) | `Authorization: Bearer <token>` atau `X-Reposter-Token` |

Backend menyediakan helper `registerTaskEndpoints` di
`backend/src/services/tasksEndpoints.js` untuk mendaftarkan dua route tersebut ke
server (Express/Koa/Fastify yang mendukung `app.get`).

## Query Params (Filter)

- `periode` (string, opsional): label periode (mis. `weekly`, `monthly`).
- `status` (string, opsional): status tugas (`pending`, `in_progress`, `done`, dll).
- `client_id` (string, opsional): filter berdasarkan client/polres.
- `user_id` (string, opsional): filter berdasarkan user/nrp/assignee.
- `start_date` (string, opsional): tanggal mulai (ISO `YYYY-MM-DD`).
- `end_date` (string, opsional): tanggal selesai (ISO `YYYY-MM-DD`).
- `limit` (number, opsional): jumlah item per halaman (default 50, max 200).
- `offset` (number, opsional): offset pagination.
- `client_id` (string, opsional): ID client untuk `GET /api/insta/posts`.

> Backend juga menerima alias `tanggal_mulai` / `tanggal_selesai` untuk
> kompatibilitas dengan API lama.

## Skema Response

Response dibuat stabil oleh helper `tasksEndpoints` dan selalu mengikuti pola:

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "title": "Tugas Official",
        "description": "Isi tugas",
        "status": "pending",
        "task_type": "official",
        "client_id": "client_01",
        "client_name": "Polres ABC",
        "assigned_to": "NRP123456",
        "due_date": "2024-10-31",
        "period_start": "2024-10-01",
        "period_end": "2024-10-31",
        "metadata": {}
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0
    },
    "filters": {
      "periode": "monthly",
      "status": "pending",
      "client_id": "client_01",
      "user_id": "NRP123456",
      "start_date": "2024-10-01",
      "end_date": "2024-10-31",
      "limit": 50,
      "offset": 0,
      "task_type": "official"
    }
  },
  "meta": {
    "schema_version": "2024-10-01",
    "generated_at": "2024-10-01T12:00:00.000Z"
  }
}
```

## Autentikasi (Dashboard & Reposter)

Endpoint menerima token dari:

- `Authorization: Bearer <token>` (dashboard/umum).
- `X-Reposter-Token: <token>` atau `X-Cicero-Reposter-Token` (reposter).

Selama token valid di middleware autentikasi backend, kedua endpoint dapat
diakses oleh aplikasi reposter.

## Integrasi di Frontend

Helper front-end tersedia di `cicero-dashboard/utils/api.ts`:

```ts
import { fetchPosts, getOfficialTasks, getSpecialTasks } from "@/utils/api";

const official = await getOfficialTasks(token, { periode: "monthly" });
const special = await getSpecialTasks(token, { status: "pending" });
const officialPosts = await fetchPosts(token, clientId);
```

Pastikan token yang dipakai sesuai konteks:

- Dashboard: `cicero_token`
- Reposter: `reposter_token`
