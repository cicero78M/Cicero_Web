# Research: Landing Page Relevance Refresh

## Decision 1: Consultation/contact becomes the primary CTA

- **Decision**: Make consultation or direct contact the primary CTA for public visitors, while keeping dashboard login and claim/update profile as secondary actions.
- **Rationale**: The clarified feature scope targets decision-makers evaluating Cicero, not existing internal operators looking for the fastest login path. This aligns the public funnel with discovery and qualification while preserving existing access routes.
- **Alternatives considered**:
  - Keep dashboard login as primary: rejected because it frames `/` as an internal launcher instead of a public explanation page.
  - Make SOP/knowledge-base navigation primary: rejected because it helps existing operators more than evaluators.

## Decision 2: Unsupported public claims must be removed or neutralized

- **Decision**: Remove or replace static pricing, internal-style testimonial claims, and the newsletter form that currently resolves with a local `alert` success state unless they can be backed by a real operational source during implementation.
- **Rationale**: The clarified spec explicitly forbids unsupported public claims and fake success states. Trust is a higher priority than keeping visually attractive but unverifiable sections.
- **Alternatives considered**:
  - Keep the sections with softer wording: rejected because the page would still imply real public evidence or live lead capture where none exists.
  - Preserve pricing only: rejected because no current repository evidence establishes pricing as a maintained public source of truth.

## Decision 3: The landing page should be organized around decision-maker proof, not feature hype

- **Decision**: Reframe copy and section ordering around evaluator needs: what Cicero solves, how it supports operational coordination, what public evidence can be shown, and how to contact the team.
- **Rationale**: The current page mixes futuristic positioning with internal workflow claims that are only partially grounded in the existing dashboard and docs. The plan should favor concrete, supported use cases drawn from README and public knowledge-base routes.
- **Alternatives considered**:
  - Keep current “next-gen command dashboard” positioning and only polish visuals: rejected because the user request is about relevance as well as attractiveness.
  - Target mixed audiences equally: rejected because it weakens CTA hierarchy and makes proof selection inconsistent.

## Decision 4: Refactor the monolithic route into bounded landing sections

- **Decision**: Keep `cicero-dashboard/app/page.jsx` as the route entry, but extract landing-specific sections or content configuration into `cicero-dashboard/components/landing/` if doing so reduces page complexity without introducing unnecessary abstraction.
- **Rationale**: The current file is long, content-heavy, and mixes copy, layout, CTA configuration, and transient interaction state. Extracting bounded presentational sections improves maintainability while honoring the constitution’s modular-boundary rule.
- **Alternatives considered**:
  - Leave all logic in `app/page.jsx`: rejected because future edits to copy and section ordering remain cumbersome and error-prone.
  - Build a fully generic CMS-like content system: rejected because the feature scope does not justify that complexity.

## Decision 5: Preserve client-side redirect behavior and avoid new public data dependencies

- **Decision**: Keep the route compatible with `useAuthRedirect` and avoid adding required runtime fetches or new backend endpoints for public landing content.
- **Rationale**: The existing route already depends on auth hydration and redirect behavior for logged-in users. Adding remote dependencies would increase complexity, introduce new failure modes, and work against the goal of a fast, trustworthy public page.
- **Alternatives considered**:
  - Convert the feature into a data-driven public page backed by new APIs: rejected because there is no spec requirement for it and it expands scope into backend and content operations.
  - Remove redirect logic for simplicity: rejected because it would break existing user behavior explicitly preserved in the spec.
