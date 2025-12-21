# Endpoint Tugas (Official & Special)

Dokumen ini menjelaskan endpoint tugas untuk menyamai perilaku `pegiat_medsos_app`
serta cara memanggilnya dari dashboard/reposter.

## Ringkasan Endpoint

| Endpoint | Deskripsi | Token |
| --- | --- | --- |
| `GET /api/tasks/special` | Daftar tugas khusus | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `GET /api/insta/posts` | Daftar postingan official (reposter) | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `GET /api/insta/posts-khusus` | Daftar postingan khusus (reposter) | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `GET /api/link-reports` | Tautan laporan per platform untuk tugas official **atau** deteksi duplikasi link laporan | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `GET /api/link-reports-khusus` | Tautan laporan per platform untuk tugas khusus | `Authorization: Bearer <token>` atau `X-Reposter-Token` |
| `POST /api/link-reports` | Kirim link laporan reposter | `Authorization: Bearer <token>` atau `X-Reposter-Token` |

Backend menyediakan helper `registerTaskEndpoints` di
`backend/src/services/tasksEndpoints.js` untuk mendaftarkan route tugas khusus ke
server (Express/Koa/Fastify yang mendukung `app.get`).

> Catatan: tugas official reposter tidak lagi memakai `GET /api/tasks/official`.
> Halaman `/reposter/tasks/official` kini menarik posting Instagram per
> `client_id` dari `GET /api/insta/posts`, memfilter konten "hari ini" dan
> mengurutkannya berdasarkan `created_at`.
>
> Halaman `/reposter/tasks/special` kini mengikuti pola yang sama melalui
> `GET /api/insta/posts-khusus?client_id=...` untuk menampilkan postingan
> khusus harian.

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
- `client_id` (string, opsional): ID client untuk `GET /api/insta/posts-khusus`.

> Backend juga menerima alias `tanggal_mulai` / `tanggal_selesai` untuk
> kompatibilitas dengan API lama.

## Query Params (Laporan Reposter)

- `shortcode` (string, wajib): shortcode postingan Instagram yang dilaporkan.
- `user_id` (string, wajib): ID user/NRP pelapor (dipakai untuk mencari laporan).
- Gunakan `GET /api/link-reports-khusus` untuk laporan tugas khusus.

Front-end reposter juga memakai parameter ini untuk menyinkronkan badge
**Sudah dilaporkan** di daftar tugas official dengan memanggil
`getReposterReportLinks` per postingan yang memiliki shortcode valid.

## Query Params (Deteksi Duplikasi Link)

- `links[]` (string, wajib): kumpulan link laporan yang ingin dicek
  duplikasinya. Backend mengembalikan daftar link yang sudah pernah dilaporkan.

## Payload (Kirim Link Laporan)

```json
{
  "shortcode": "abc123",
  "user_id": "NRP123456",
  "post_id": "post_123",
  "client_id": "client_01",
  "instagram_link": "https://www.instagram.com/p/abc123",
  "facebook_link": "https://www.facebook.com/permalink.php?story_fbid=...",
  "twitter_link": "https://twitter.com/...",
  "tiktok_link": "https://www.tiktok.com/@.../video/...",
  "youtube_link": "https://youtu.be/..."
}
```

Catatan sumber `shortcode`:

- Frontend mengekstrak dari `instagram_link` yang berformat `/p/{shortcode}`,
  `/reel/{shortcode}`, `/reels/{shortcode}`, atau `/tv/{shortcode}`.
- Jika tidak berhasil diekstrak, frontend mengirim fallback dari `post_id`.

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

### Skema Response (Report Links)

Endpoint `/api/link-reports` (atau `/api/link-reports-khusus` untuk tugas
khusus) mengembalikan daftar tautan laporan per platform. Response bisa
menyediakan field `*_link` langsung pada `data`, selain bentuk objek `links`.

```json
{
  "success": true,
  "data": {
    "post_id": "post_123",
    "user_id": "NRP123456",
    "instagram_link": "https://www.instagram.com/p/abc123",
    "facebook_link": "https://www.facebook.com/permalink.php?story_fbid=...",
    "twitter_link": "https://twitter.com/...",
    "tiktok_link": "https://www.tiktok.com/@.../video/...",
    "youtube_link": "https://youtu.be/...",
    "links": {
      "instagram": "https://www.instagram.com/p/abc123",
      "facebook": "https://www.facebook.com/permalink.php?story_fbid=...",
      "twitter": "https://twitter.com/...",
      "tiktok": "https://www.tiktok.com/@.../video/...",
      "youtube": "https://youtu.be/..."
    }
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
import { fetchPosts, getSpecialTasks } from "@/utils/api";

const special = await getSpecialTasks(token, { status: "pending" });
const officialPosts = await fetchPosts(token, clientId);
```

Untuk menampilkan status laporan yang akurat di daftar tugas official, UI
melakukan panggilan `getReposterReportLinks` untuk setiap shortcode yang valid
dengan parameter `user_id` dari profil reposter, lalu menandai `reported = true`
jika backend mengembalikan tautan laporan.

Pastikan token yang dipakai sesuai konteks:

- Dashboard: `cicero_token`
- Reposter: `reposter_token`
