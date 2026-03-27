# Quickstart: Landing Page Relevance Refresh

## Goal

Implement and verify a public landing page refresh that is evaluator-focused, trustworthy, and consistent with current Cicero capabilities.

## Implementation Steps

1. Open `D:/Cicero_Web/cicero-dashboard/app/page.jsx` and identify current sections that conflict with the spec:
   - internal-first CTA hierarchy
   - unsupported pricing/testimonial/newsletter elements
   - overly generic or unsupported product claims
2. Extract landing-specific sections or content maps into `D:/Cicero_Web/cicero-dashboard/components/landing/` only where it reduces complexity.
3. Rewrite hero and supporting sections for the primary persona:
   - evaluator or coordinator reviewing Cicero
   - primary CTA to consultation/contact
   - secondary CTA for login and claim
4. Replace unsupported trust elements with validated or neutral content.
5. Preserve and re-check `D:/Cicero_Web/cicero-dashboard/hooks/useAuthRedirect.ts` behavior.
6. Add or update focused tests for landing-page rendering, CTA hierarchy, and redirect-sensitive behavior where practical.

## Verification Commands

From `D:/Cicero_Web/cicero-dashboard`:

```bash
npm run lint
npm test
npm run build
```

## Manual Verification

1. Open `/` while logged out.
2. Confirm the hero explains Cicero in evaluator-oriented language and presents consultation/contact as the dominant CTA.
3. Confirm login and claim remain visible but secondary.
4. Confirm unsupported pricing, internal testimonial, and fake newsletter success flow are gone or replaced by neutral content.
5. Confirm `/terms-of-service` and `/privacy-policy` remain accessible.
6. Open `/` while logged in and confirm redirect still sends the user to the last protected path or `/dashboard`.
7. Check desktop and mobile widths for hierarchy, readability, and focus states.

## Expected Outcome

The landing page becomes a credible public entry point for Cicero, while existing internal access behavior remains intact.
