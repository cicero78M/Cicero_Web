# Server Setup and Deployment Workflow

This document explains how to prepare a server and deploy **Cicero_Web**.

## Prerequisites

- **Node.js** `>=20` and `npm`
- **git** for cloning the repository
- Optional: **pm2** or systemd to run the app as a service

## 1. Clone the Repository

```bash
git clone <repository-url>
cd Cicero_Web
```

## 2. Install Dependencies

Navigate into the Next.js application directory and install packages:

```bash
cd cicero-dashboard
npm install
```

## 3. Configure Environment

Create a `.env.local` file inside `cicero-dashboard` and define the API URL used by the dashboard:

```bash
NEXT_PUBLIC_API_URL=<backend base url>
```

## 4. Build the Application

Generate a production build with:

```bash
npm run build
```

## 5. Start the Server

Launch the server on port 3000:

```bash
npm start
```

The application will be available at `http://localhost:3000`.

To keep the service running in the background you can use `pm2` or create a `systemd` service pointing to `npm start`.

## 6. Optional: Reverse Proxy

If you want to serve the dashboard under your domain, configure a web server such as Nginx to proxy requests to `http://localhost:3000`.

## 7. Running Tests

To run the Jest test suite:

```bash
npm test
```

Run the tests inside `cicero-dashboard` whenever you change code.

---

Following this workflow will set up a production-ready environment for **Cicero_Web**.
