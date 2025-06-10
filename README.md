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

1. Ensure [Node.js](https://nodejs.org/) and `npm` are installed.
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

> **Note**: Avoid using the experimental Turbopack flag (`next dev --turbopack`),
> as it can cause module resolution errors for `lightningcss`.

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

For more information about Next.js features, refer to the documentation inside `cicero-dashboard/README.md`.

