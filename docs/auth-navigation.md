# Authentication Hydration & Navigation Memory

The dashboard now tracks authentication hydration status and remembers the last protected route a user visited. This improves the login experience by avoiding premature redirects and returning users to their previous page when possible.

## Hydration lifecycle

- `AuthProvider` reads authentication values (`cicero_token`, `client_id`, `user_id`, `user_role`) from `localStorage` on mount.
- While these values are loading, the context exposes `isHydrating: true`. Once hydration finishes, `isHydrating` becomes `false`.
- Hooks that gate routes (e.g., `useRequireAuth`) should wait until `isHydrating` is `false` before deciding whether to redirect.

## Remembering the last protected route

- Client-side navigation stores the most recent non-public pathname in `localStorage` as `last_pathname`. Public paths such as `/`, `/login`, `/login-update`, `/claim`, and any `/reposter` route are ignored so the landing page never auto-redirects into reposter login.
- `useAuthRedirect` checks `last_pathname` after hydration completes. If a valid path exists and the user is authenticated, it redirects there; otherwise it falls back to `/dashboard`.

## Practical effects

- Authenticated users who return to the site are kept on their current route during hydration, preventing unwanted jumps to `/`.
- After logging in again, users land on the last protected page they visited instead of always starting at `/dashboard`.

## Landing CTA terbaru

- Landing page menampilkan tiga CTA login: `Login Dashboard` ke `/login`, `Login Update` ke `/login-update`, dan `Login Reposter` ke `/reposter/login`.
- Halaman `/login-update` memberi pilihan eksplisit menuju login claim (`/claim`) dan login reposter (`/reposter/login`).

## Optimasi performa halaman login dashboard

Perubahan pada `cicero-dashboard/app/login/page.jsx` untuk meningkatkan responsivitas UI dan mengurangi beban render:

- Komponen dekoratif berat (backdrop blur besar dan panel onboarding tambahan) disembunyikan pada layar kecil (`< lg`) agar interaksi form login lebih ringan di perangkat mobile.
- Kartu promosi sisi kiri hanya ditampilkan di desktop (`lg`) sehingga layout mobile fokus pada form utama dan lebih cepat diproses browser.
- Animasi Framer Motion kini mempertimbangkan `useReducedMotion()`. Saat preferensi reduced motion aktif, animasi masuk dan animasi berulang berjalan tanpa transisi.
- Padding dan efek blur pada kartu form login disesuaikan untuk viewport kecil agar rendering lebih hemat tanpa mengubah alur autentikasi.

Dampak utama: waktu interaksi awal terasa lebih cepat pada perangkat menengah/bawah, scroll/layout shift berkurang pada mobile, dan pengalaman aksesibilitas meningkat untuk pengguna dengan preferensi reduced motion.
