# Data Model: Landing Page Relevance Refresh

## Overview

This feature does not introduce persisted backend entities. The “data model” is the content and interaction structure required to render and verify the refreshed public landing page.

## Entities

### PublicVisitor

- **Purpose**: Represents a person arriving at the public landing page.
- **Attributes**:
  - `persona`: evaluator, coordinator, or existing internal user
  - `authState`: authenticated or unauthenticated
  - `intent`: evaluate product, contact team, login, update profile, open guidance
- **Validation Rules**:
  - Authenticated visitors must be redirected by existing auth logic rather than using public CTA flow.
  - Unauthenticated visitors must remain on the landing page and see CTA hierarchy clearly.

### ValueMessage

- **Purpose**: A supported public statement describing what Cicero does and why it matters.
- **Attributes**:
  - `headline`
  - `supportingCopy`
  - `supportedUseCase`
  - `evidenceStatus`: validated or neutral
- **Validation Rules**:
  - Every value message must map to capabilities already supported by the product or existing docs.
  - Unsupported claims cannot be published as validated proof.

### LandingSection

- **Purpose**: A bounded content block within the refreshed landing page.
- **Attributes**:
  - `id`
  - `purpose`
  - `priority`
  - `audienceFit`
  - `allowedContentTypes`
  - `visibilityRules`
- **Validation Rules**:
  - Section ordering must support the primary evaluator flow.
  - Sections with unsupported proof or fake interactions must be removed or replaced before release.

### CallToAction

- **Purpose**: A user action exposed from the landing page.
- **Attributes**:
  - `label`
  - `destination`
  - `hierarchy`: primary or secondary
  - `audience`
  - `interactionType`: internal route, external contact link, informational route
- **Validation Rules**:
  - Exactly one CTA hierarchy should dominate for unauthenticated users in hero context.
  - Primary CTA must be contact/consultation.
  - Login and claim remain discoverable but secondary.

### TrustAsset

- **Purpose**: Any element used to increase credibility on the public page.
- **Attributes**:
  - `type`: use case, legal reference, process reference, validated metric, validated testimonial, neutral explainer
  - `source`
  - `status`: validated, neutral replacement, removed
- **Validation Rules**:
  - Pricing, testimonial, and metric blocks must have validated sources or be replaced with neutral trust content.
  - Legal references must remain accessible.

### InteractionState

- **Purpose**: Defines user-visible behavior for interactive elements on the landing page.
- **Attributes**:
  - `surface`: CTA, contact action, retained form, redirect state
  - `state`: idle, hover, focus, success, error, redirecting
  - `message`
- **Validation Rules**:
  - No success state may be shown without a real completed action.
  - Focus and hover states must remain visible and accessible on desktop and mobile-relevant interactions.

## Relationships

- `PublicVisitor` follows one or more `CallToAction` paths.
- `LandingSection` contains `ValueMessage`, `CallToAction`, and `TrustAsset` items.
- `InteractionState` applies to `CallToAction` and any retained interactive capture surface.
- `TrustAsset` supports one or more `ValueMessage` entries.

## State Transitions

### Visitor Flow

1. `unauthenticated` visitor lands on `/`
2. visitor scans `ValueMessage` and `LandingSection` content
3. visitor chooses a `CallToAction`
4. visitor either:
   - opens consultation/contact path
   - navigates to login/claim/guidance

### Authenticated Flow

1. `authenticated` visitor lands on `/`
2. `useAuthRedirect` evaluates hydration and stored path
3. visitor is redirected to last protected route or `/dashboard`

## Out-of-Scope Data Changes

- No new backend schema
- No new API contract
- No new persistent form submission workflow unless separately specified later
