# Implementation Plan: Landing Page Relevance Refresh

**Branch**: `001-landing-page-refresh` | **Date**: 2026-03-27 | **Spec**: [spec.md](D:/Cicero_Web/specs/001-landing-page-refresh/spec.md)
**Input**: Feature specification from `D:/Cicero_Web/specs/001-landing-page-refresh/spec.md`

## Summary

Refresh the public landing page so it speaks to decision-makers evaluating Cicero, promotes consultation/contact as the primary CTA, keeps login and claim as secondary actions, removes unsupported public claims, and preserves authenticated redirect behavior. The implementation will stay within the existing Next.js frontend by refactoring the current monolithic `/` page into clearer landing-page sections and validating the resulting UX with focused automated and manual checks.

## Technical Context

**Language/Version**: JavaScript/TypeScript on Node.js 20+ with React 18.3.1 and Next.js 15.5.7  
**Primary Dependencies**: Next.js App Router, React, `lucide-react`, existing auth context/hooks, Tailwind-based utility styling already used in `cicero-dashboard/app/page.jsx`  
**Storage**: N/A for this feature; no new persistence planned  
**Testing**: `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `next lint`, production build verification  
**Target Platform**: Public web route for modern desktop and mobile browsers within the existing Cicero dashboard deployment  
**Project Type**: Existing Next.js web application  
**Performance Goals**: Keep `/` as a lightweight public route with no new required runtime fetches, surface primary CTA above the fold on desktop and mobile, and preserve immediate redirect behavior for authenticated users  
**Constraints**: No backend/API changes; preserve `useAuthRedirect` behavior; retain legal links and public route integrity; remove fake success flows and unsupported public claims; keep content and interactions accessible  
**Scale/Scope**: One public route refresh (`/`), possible extraction of several landing-specific presentational components/configs, one redirect hook verification path, and light documentation/test updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Existing-system strategy is explicit. This is an in-place refactor of the existing public landing page, preserving authenticated redirect behavior, legal links, and public entry paths while replacing unclear or unsupported content.
- PASS: Module boundaries are explicit. Route composition remains in `cicero-dashboard/app/page.jsx`, redirect logic stays in `cicero-dashboard/hooks/useAuthRedirect.ts`, and any new reusable landing sections move into `cicero-dashboard/components/landing/` or adjacent local modules.
- PASS: UX scope is explicit. The plan covers primary decision-maker flow, CTA hierarchy, mobile and desktop layout, accessible focus states, and honest success/error outcomes for any retained interaction.
- PASS: Security scope is explicit. The page remains public, must not expose protected operational data, and must continue failing closed by redirecting authenticated users through existing auth logic instead of duplicating access control in content.
- PASS: Verification scope is explicit. The plan includes lint/build/test coverage for landing route changes plus manual checks for CTA routing, authenticated redirect, mobile readability, and legal/public route integrity.

## Project Structure

### Documentation (this feature)

```text
specs/001-landing-page-refresh/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── landing-page-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
cicero-dashboard/
├── app/
│   ├── page.jsx
│   ├── terms-of-service/
│   ├── privacy-policy/
│   ├── login/
│   ├── login-update/
│   ├── claim/
│   ├── mekanisme-absensi/
│   └── panduan-sop/
├── components/
│   └── landing/                 # new landing-specific presentational sections if extracted
├── hooks/
│   └── useAuthRedirect.ts
├── lib/                         # optional copy/config helpers if extraction is useful
└── __tests__/                   # landing route and redirect behavior tests if added

docs/
└── [no new doc required by default; README may be updated if public positioning changes]
```

**Structure Decision**: Keep the route entry in `cicero-dashboard/app/page.jsx`, preserve `useAuthRedirect` as the single authenticated redirect mechanism, and extract landing-specific sections/content maps into `cicero-dashboard/components/landing/` only where doing so reduces the current page complexity without spreading feature logic across unrelated modules.

## Phase 0: Research

Research is required to lock down content and implementation decisions that materially affect scope, UX trust, and maintainability.

1. Validate which current landing-page claims are supported by the product and docs, and which must be removed or rewritten.
2. Define the safest treatment for unsupported public elements such as static pricing, internal testimonial copy, and the current email form with an `alert` success state.
3. Decide the refactor shape for the current single-file landing page so the implementation stays incremental and aligned with repo module boundaries.
4. Confirm verification strategy for a public Next.js route that is still client-rendered due to authenticated redirect logic.

**Phase 0 Output**: [research.md](D:/Cicero_Web/specs/001-landing-page-refresh/research.md)

## Phase 1: Design & Contracts

1. Model the landing-page content entities and interaction states needed for implementation and test design.
2. Define the UI contract for `/` covering section order, CTA hierarchy, redirect rules, and unsupported-content handling.
3. Produce a quickstart verification flow for implementation and review.
4. Update agent context after artifacts are written.

**Phase 1 Outputs**:

- [data-model.md](D:/Cicero_Web/specs/001-landing-page-refresh/data-model.md)
- [landing-page-ui.md](D:/Cicero_Web/specs/001-landing-page-refresh/contracts/landing-page-ui.md)
- [quickstart.md](D:/Cicero_Web/specs/001-landing-page-refresh/quickstart.md)

## Post-Design Constitution Check

- PASS: Design remains an incremental refactor centered on the existing landing route rather than a rewrite.
- PASS: New structure stays modular and bounded to landing-page route UI, shared landing sections, and existing auth hook usage.
- PASS: UX artifacts now define content hierarchy, trust handling, responsive expectations, and honest interaction states.
- PASS: Security expectations remain limited and explicit: public-only content, no new secrets/data flows, authenticated redirect preserved.
- PASS: Verification artifacts now specify both automated and manual checks before implementation.

## Complexity Tracking

No constitution violations are expected for this feature. The plan intentionally avoids backend changes, new persistence, or cross-module rewrites.
