# Audit Execution Plan (30/60/90)

## Tujuan
Menstabilkan kualitas, mempercepat delivery, dan menurunkan risiko regresi pada Cicero frontend.

## Prioritas 0 (minggu ini)
1. Aktifkan quality gate CI (lint, test, build).
2. Tetapkan baseline warning lint + target penurunan bertahap.
3. Freeze sementara fitur besar di area berisiko tinggi (`executive-summary`, `users`) sampai refactor awal selesai.

## 30 Hari (Stabilisasi)
- Refactor `app/executive-summary/page.jsx` menjadi:
  - `view/ExecutiveSummaryPage.tsx`
  - `hooks/useExecutiveSummaryFilters.ts`
  - `hooks/useExecutiveSummaryData.ts`
  - `components/executive-summary/*`
- Refactor `app/users/page.jsx` menjadi page + hooks + table/card component.
- Tambah contract boundary di layer API (`utils/api.ts`) dengan normalizer terpisah.
- Enforce:
  - no new `any` di file baru
  - no new lint warning di PR

## 60 Hari (Standardisasi)
- Definisikan API contract (OpenAPI/Zod) untuk endpoint inti.
- Table-driven test untuk role/scope/regional access.
- Error envelope standar: `{ success, code, message, correlation_id }`.

## 90 Hari (Skalabilitas)
- Observability dashboard (latency, error-rate, endpoint 4xx/5xx).
- Caching strategy endpoint berat + invalidasi.
- Approval workflow lintas fitur (draft/review/approve/reject).

## KPI
- Lint warning turun >= 60%
- Mean PR review time < 24 jam
- Regression bug production turun >= 50%
- Build success rate >= 95%
