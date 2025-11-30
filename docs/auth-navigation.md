# Authentication Hydration & Navigation Memory

The dashboard now tracks authentication hydration status and remembers the last protected route a user visited. This improves the login experience by avoiding premature redirects and returning users to their previous page when possible.

## Hydration lifecycle

- `AuthProvider` reads authentication values (`cicero_token`, `client_id`, `user_id`, `user_role`) from `localStorage` on mount.
- While these values are loading, the context exposes `isHydrating: true`. Once hydration finishes, `isHydrating` becomes `false`.
- Hooks that gate routes (e.g., `useRequireAuth`) should wait until `isHydrating` is `false` before deciding whether to redirect.

## Remembering the last protected route

- Client-side navigation stores the most recent non-public pathname in `localStorage` as `last_pathname`. Public paths such as `/`, `/login`, and `/claim` are ignored.
- `useAuthRedirect` checks `last_pathname` after hydration completes. If a valid path exists and the user is authenticated, it redirects there; otherwise it falls back to `/dashboard`.

## Practical effects

- Authenticated users who return to the site are kept on their current route during hydration, preventing unwanted jumps to `/`.
- After logging in again, users land on the last protected page they visited instead of always starting at `/dashboard`.
