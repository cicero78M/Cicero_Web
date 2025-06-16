# Cicero Web

This repository contains a Next.js dashboard used for visualizing data from the Cicero backend. The application resides in the `cicero-dashboard` directory.

## Directory Overview

```
Cicero_Web/
├── cicero-dashboard/   # Next.js application
├── LICENSE             # Project license
└── README.md           # This file
```

Inside `cicero-dashboard` you will find the typical Next.js project layout:

- `app/` – application pages and layouts
- `components/` – shared React components
- `hooks/` – custom React hooks
- `utils/` – helper functions and API utilities

## Installation

1. Ensure [Node.js](https://nodejs.org/) (version 20 LTS) and `npm` are installed.
2. Install dependencies from within the dashboard directory:

```bash
cd cicero-dashboard
npm install
```

## Starting the App

Run the development server with:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).
For a production build, run:

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file inside `cicero-dashboard` and define the following variable:

```bash
NEXT_PUBLIC_API_URL=<backend base url>
```

`NEXT_PUBLIC_API_URL` specifies the Cicero API endpoint that the dashboard will use.

## Usage Notes

- The login page expects a valid API endpoint provided by `NEXT_PUBLIC_API_URL`.
- Pages under the `app/` directory automatically refresh during development when files are edited.
- Static assets such as icons reside in `cicero-dashboard/public`.
- The backend no longer restricts how many users can log in at once.
- Clients may allow an unlimited number of concurrent sessions.

For more information about Next.js features, refer to the documentation inside `cicero-dashboard/README.md`.


## Instagram Post Analysis API

The Instagram Post Analysis page retrieves Instagram analytics from the backend. Data is fetched via `getInstagramProfileViaBackend` and `getInstagramPostsViaBackend` in `cicero-dashboard/utils/api.js`.

### Profile Fields
- `username`
- `followers`
- `following`
- `bio`

### Post Fields
- `id`
- `created_at`
- `type`
- `caption`
- `like_count`
- `comment_count`
- `share_count`
- `view_count` (optional)
- `thumbnail` (optional)

These fields are provided by the backend endpoints `/api/insta/rapid-profile` and `/api/insta/rapid-posts`.

Thumbnails from Instagram occasionally use the `.heic` extension which many browsers
cannot display. The frontend automatically replaces `.heic` with `.jpg` and falls
back to `/file.svg` if loading fails.

The dashboard provides a single Instagram Post Analysis page at `/instagram`
that combines the info and post analytics previously found under
`/info/instagram` and `/posts/instagram`.

## Instagram Basic API

The `/instagram-basic` page demonstrates using the official Instagram Basic
Display API. Paste an access token in the form to load your profile and recent
posts. Data is retrieved via `getInstagramBasicProfile` and
`getInstagramBasicPosts` in `cicero-dashboard/utils/api.ts`.

## TikTok Post Analysis API

The TikTok Post Analysis page works similarly to the Instagram one but uses the TikTok endpoints `getTiktokProfileViaBackend` and `getTiktokPostsViaBackend` found in `cicero-dashboard/utils/api.js`.

The dashboard provides a single TikTok Post Analysis page at `/tiktok`
that merges the info and post analytics into one view. By default,
the visualized posts are limited to the current month.

### Profile Fields
- `username`
- `followers`
- `following`
- `bio`

### Post Fields
- `id`
- `created_at`
- `type`
- `caption`
- `like_count`
- `comment_count`
- `share_count`
- `view_count` (optional)
- `thumbnail` (optional)

These values are provided by `/api/tiktok/rapid-profile` and `/api/tiktok/rapid-posts`.
