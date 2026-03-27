# Tasks: Landing Page Relevance Refresh

**Input**: Design documents from `D:/Cicero_Web/specs/001-landing-page-refresh/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Tests**: Verification tasks are REQUIRED. Automated tests are included because this work touches a public route, CTA behavior, and authenticated redirect behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Dashboard**: `cicero-dashboard/app/`, `cicero-dashboard/components/`, `cicero-dashboard/hooks/`, `cicero-dashboard/lib/`, `cicero-dashboard/__tests__/`
- **Docs**: `README.md`
- Paths in tasks match the structure chosen in `plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the touched modules and create the structure needed for the landing-page refactor.

- [X] T001 Confirm the impacted files in `cicero-dashboard/app/page.jsx`, `cicero-dashboard/hooks/useAuthRedirect.ts`, `cicero-dashboard/__tests__/`, and `README.md` against `D:/Cicero_Web/specs/001-landing-page-refresh/plan.md`
- [X] T002 Create the landing-specific component directory and placeholder files in `cicero-dashboard/components/landing/`
- [X] T003 [P] Create the landing content/config module for supported copy and CTA metadata in `cicero-dashboard/lib/landingPageContent.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared prerequisites that must be in place before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Audit the current public claims in `cicero-dashboard/app/page.jsx` against `README.md` and encode only supported/neutral content in `cicero-dashboard/lib/landingPageContent.ts`
- [X] T005 [P] Extract shared landing section primitives for reusable layout and section shells in `cicero-dashboard/components/landing/SectionShell.jsx` and `cicero-dashboard/components/landing/SectionHeading.jsx`
- [X] T006 [P] Add baseline route coverage for public landing render in `cicero-dashboard/__tests__/landingPage.test.tsx`
- [X] T007 Establish shared verification helpers for CTA and legal-link assertions in `cicero-dashboard/__tests__/landingPage.test.tsx`

**Checkpoint**: Foundation ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Pengunjung memahami nilai Cicero dengan cepat (Priority: P1) 🎯 MVP

**Goal**: Reframe the landing page so evaluators immediately understand Cicero’s current value and see only supported or neutral proof.

**Independent Test**: Open `/` while logged out and confirm the hero plus first supporting sections explain Cicero clearly, use evaluator-oriented copy, and avoid unsupported public claims.

### Tests for User Story 1

- [X] T008 [P] [US1] Add assertions for evaluator-focused hero copy and supported proof sections in `cicero-dashboard/__tests__/landingPage.test.tsx`
- [X] T009 [P] [US1] Add assertions that unsupported pricing and internal-testimonial content no longer render in `cicero-dashboard/__tests__/landingPage.test.tsx`
- [X] T010 [P] [US1] Add assertions that unsupported public KPI or metric cards no longer render as validated proof in `cicero-dashboard/__tests__/landingPage.test.tsx`

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement the evaluator-focused hero section in `cicero-dashboard/components/landing/HeroSection.jsx`
- [X] T012 [P] [US1] Implement supported use-case and value-message sections in `cicero-dashboard/components/landing/ValueSection.jsx` and `cicero-dashboard/components/landing/UseCaseSection.jsx`
- [X] T013 [P] [US1] Implement neutral trust/proof sections in `cicero-dashboard/components/landing/TrustSection.jsx`
- [X] T014 [US1] Recompose `cicero-dashboard/app/page.jsx` to use the new landing sections and supported content from `cicero-dashboard/lib/landingPageContent.ts`, including removal or neutralization of unsupported KPI-style proof

**Checkpoint**: User Story 1 should now be independently functional and explain Cicero clearly for evaluators.

---

## Phase 4: User Story 2 - Pengunjung masuk ke jalur aksi yang tepat (Priority: P2)

**Goal**: Establish a clear CTA hierarchy for public visitors while preserving authenticated redirect behavior and internal access paths.

**Independent Test**: Open `/` while logged out and confirm consultation/contact is the dominant CTA while login and claim remain secondary; open `/` while logged in and confirm redirect still works.

### Tests for User Story 2

- [X] T015 [P] [US2] Add CTA hierarchy assertions for primary consultation/contact versus secondary login and claim actions in `cicero-dashboard/__tests__/landingPage.test.tsx`
- [X] T016 [P] [US2] Add authenticated redirect regression coverage for `cicero-dashboard/hooks/useAuthRedirect.ts` in `cicero-dashboard/__tests__/useAuthRedirect.test.tsx`
- [X] T017 [P] [US2] Add assertions for preserved secondary public routes and labels for `/login`, `/login-update`, `/claim`, `/mekanisme-absensi`, and `/panduan-sop` in `cicero-dashboard/__tests__/landingPage.test.tsx`

### Implementation for User Story 2

- [X] T018 [P] [US2] Implement the landing CTA group with primary and secondary action variants in `cicero-dashboard/components/landing/CtaGroup.jsx`
- [X] T019 [P] [US2] Implement secondary access and guidance links in `cicero-dashboard/components/landing/SecondaryPathsSection.jsx`
- [X] T020 [US2] Update `cicero-dashboard/app/page.jsx` and verify `cicero-dashboard/hooks/useAuthRedirect.ts` preserve the intended public-versus-authenticated flow and all preserved secondary routes remain reachable

**Checkpoint**: User Stories 1 and 2 should both work independently, with clear CTA routing and redirect safety.

---

## Phase 5: User Story 3 - Pengunjung menilai kredibilitas halaman (Priority: P3)

**Goal**: Make the page feel trustworthy by removing fake outcomes, keeping legal references, and ensuring honest interaction states across desktop and mobile.

**Independent Test**: Review the full page and confirm unsupported pricing/testimonial/newsletter patterns are gone or neutralized, legal links remain, and no fake success state is shown.

### Tests for User Story 3

- [X] T021 [P] [US3] Add assertions that fake newsletter success and unsupported interaction surfaces are absent or replaced in `cicero-dashboard/__tests__/landingPage.test.tsx`
- [X] T022 [P] [US3] Add assertions for legal-link visibility and footer trust content in `cicero-dashboard/__tests__/landingPage.test.tsx`

### Implementation for User Story 3

- [X] T023 [P] [US3] Remove or replace unsupported pricing, testimonial, and newsletter sections in `cicero-dashboard/app/page.jsx`
- [X] T024 [P] [US3] Implement a credibility-focused footer or trust-support section in `cicero-dashboard/components/landing/FooterSupportSection.jsx`
- [X] T025 [US3] Finalize honest interaction states, legal-link presence, and mobile-safe hierarchy in `cicero-dashboard/app/page.jsx`

**Checkpoint**: All user stories should now be independently functional and the public page should feel credible and honest.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, documentation alignment, and full verification.

- [X] T026 [P] Update public positioning notes in `README.md` if the landing-page description now differs materially from the existing summary
- [X] T027 Run route-level UX and accessibility polish across `cicero-dashboard/app/page.jsx` and `cicero-dashboard/components/landing/`
- [X] T028 Run automated verification in `cicero-dashboard` with `npm run lint`, `npm test`, and `npm run build`
- [ ] T029 Run the manual quickstart verification from `D:/Cicero_Web/specs/001-landing-page-refresh/quickstart.md`, including preserved secondary routes and unsupported-metric removal checks, and record findings in the implementation summary or PR notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **User Stories (Phases 3-5)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2; no dependency on other stories
- **User Story 2 (P2)**: Starts after Phase 2 and reuses shared landing components but remains independently testable
- **User Story 3 (P3)**: Starts after Phase 2 and can be implemented after or alongside US2 as long as the shared section structure is stable

### Within Each User Story

- Tests are defined before implementation work in that story
- Shared content/config and section primitives come before story-specific composition
- Section components come before final route integration
- Route integration completes before manual verification

### Parallel Opportunities

- T003 can run in parallel with T002 after T001
- T005, T006, and T007 can run in parallel after T004
- In US1, T011, T012, and T013 can run in parallel before T014
- In US2, T015, T016, and T017 can run in parallel; T018 and T019 can run in parallel before T020
- In US3, T021 and T022 can run in parallel; T023 and T024 can run in parallel before T025
- T026 and T027 can run in parallel after all story work is complete

---

## Parallel Example: User Story 1

```bash
Task: "Implement the evaluator-focused hero section in cicero-dashboard/components/landing/HeroSection.jsx"
Task: "Implement supported use-case and value-message sections in cicero-dashboard/components/landing/ValueSection.jsx and cicero-dashboard/components/landing/UseCaseSection.jsx"
Task: "Implement neutral trust/proof sections in cicero-dashboard/components/landing/TrustSection.jsx"
```

## Parallel Example: User Story 2

```bash
Task: "Add authenticated redirect regression coverage for cicero-dashboard/hooks/useAuthRedirect.ts in cicero-dashboard/__tests__/useAuthRedirect.test.tsx"
Task: "Add assertions for preserved secondary public routes and labels for /login, /login-update, /claim, /mekanisme-absensi, and /panduan-sop in cicero-dashboard/__tests__/landingPage.test.tsx"
Task: "Implement the landing CTA group with primary and secondary action variants in cicero-dashboard/components/landing/CtaGroup.jsx"
Task: "Implement secondary access and guidance links in cicero-dashboard/components/landing/SecondaryPathsSection.jsx"
```

## Parallel Example: User Story 3

```bash
Task: "Add assertions for legal-link visibility and footer trust content in cicero-dashboard/__tests__/landingPage.test.tsx"
Task: "Remove or replace unsupported pricing, testimonial, and newsletter sections in cicero-dashboard/app/page.jsx"
Task: "Implement a credibility-focused footer or trust-support section in cicero-dashboard/components/landing/FooterSupportSection.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate User Story 1 independently on `/`

### Incremental Delivery

1. Build the shared landing foundations once
2. Deliver US1 for evaluator clarity and supported proof
3. Add US2 for CTA hierarchy and redirect-safe entry paths
4. Add US3 for credibility cleanup and honest interaction states
5. Finish with documentation and full verification

### Suggested MVP Scope

- Phase 1
- Phase 2
- Phase 3 (User Story 1)

This is the smallest slice that already makes the landing page more relevant for Cicero and safe to review.

---

## Notes

- [P] tasks touch different files and are safe to parallelize
- Each user story remains independently testable from the public `/` route
- Automated tests are required here because redirect behavior and public CTA behavior are regression-prone
- Avoid introducing backend work or runtime data dependencies during implementation
