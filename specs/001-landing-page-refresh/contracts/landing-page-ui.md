# UI Contract: Public Landing Page

## Route

- **Route**: `/`
- **Audience**: Public visitors, with authenticated users redirected away through existing auth logic
- **Primary Outcome**: Help evaluators understand Cicero quickly and contact the team

## Required Behaviors

### Access Contract

- If the visitor is authenticated, the page must preserve existing redirect behavior through `useAuthRedirect`.
- If the visitor is unauthenticated, the page must render the public landing flow without requiring extra data fetches.

### CTA Contract

- Hero section must expose one clearly dominant primary CTA for consultation/contact.
- Login dashboard and claim/update profile must remain accessible as secondary actions.
- Public guidance links such as SOP/knowledge-base routes may be present but must not outrank the primary CTA.

### Content Contract

- Headline and supporting copy must describe current Cicero value in language suitable for decision-makers.
- Public claims must map to product capabilities or existing docs already present in the repository.
- Unsupported pricing, testimonial, or newsletter-capture sections must be removed or replaced by neutral trust content before release.

### Trust Contract

- Trust-building sections may use validated process references, operational use cases, public legal links, or neutral explanations.
- The page must not imply publicly verified metrics or testimonials where no validated source exists.

### Interaction-State Contract

- Any retained interactive surface must define idle, hover/focus, and result states.
- No interaction may report success unless a real action completes.
- External contact links must remain explicit and safe (`target`, `rel`, or internal routing as appropriate).

### Responsive and Accessibility Contract

- Primary CTA remains visible and legible on desktop and mobile.
- Heading hierarchy must stay semantic.
- Keyboard focus must be visible for links and buttons.
- Visual contrast and text density must remain readable in the existing style system.

## Suggested Section Order

1. Hero with evaluator-focused value proposition and CTA hierarchy
2. Supported use cases or operational outcomes
3. Product proof/trust content using validated or neutral material
4. Secondary paths: login, claim, guidance, legal
5. Footer with legal references

## Verification Signals

- Authenticated users do not remain on `/`
- Unauthenticated users can identify the primary CTA immediately
- No unsupported pricing/testimonial/form-success content remains
- Legal links continue to work
