# Frontend Starter Guide

This guide explains how to run the TaskFlow frontend locally.

## Required Versions

Use the versions currently expected by this repo:

```text
Node.js: v22.23.1
npm: 10.9.8
```

The Node version is pinned in `.nvmrc`:

```text
22.23.1
```

## 1. Open The Frontend Repo

```bash
cd /home/ansh/ansh/nh/Nh-fe
```

## 2. Use The Correct Node Version

If you use `nvm`:

```bash
nvm install 22.23.1
nvm use
```

Verify versions:

```bash
node -v
npm -v
```

Expected output:

```text
v22.23.1
10.9.8
```

## 3. Install Dependencies

```bash
npm install
```

For CI or a clean reproducible install from `package-lock.json`, use:

```bash
npm ci
```

## 4. Configure Environment Variables

Create a local `.env` file:

```bash
cp .env.example .env
```

Set the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Notes:

- Do not add a trailing slash.
- The backend must be running at this URL.
- Vite only exposes browser variables that start with `VITE_`.
- Do not store private secrets in frontend env variables.

## 5. Start The Development Server

```bash
npm run dev
```

Vite will print the local URL, usually:

```text
http://localhost:5173/
```

Open that URL in your browser.

## 6. Start The Backend

The frontend requires the backend API.

In the backend repo, run the Django server:

```bash
cd /home/ansh/ansh/nh/Nh-be
source .venv/bin/activate
python manage.py runserver
```

The default frontend `.env` expects:

```text
http://localhost:8000
```

## 7. Build For Production

```bash
npm run build
```

The production build is written to:

```text
dist/
```

## 8. Preview The Production Build

```bash
npm run preview
```

This serves the built `dist/` files locally for verification.

## 9. Available npm Commands

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds production assets.

```bash
npm run preview
```

Previews the production build locally.

## 10. GitHub Actions Secret

For CI/CD, add this GitHub Actions secret in the frontend repository:

```text
VITE_API_BASE_URL=https://your-backend-domain.com
```

The workflow can then inject it during `npm run build`.

## 11. Local Troubleshooting

### Login Fails

Check:

- Backend server is running.
- `.env` has the correct `VITE_API_BASE_URL`.
- Backend CORS allows `http://localhost:5173`.
- Login credentials exist in the backend database.

### API Requests Go To The Wrong URL

Restart the Vite dev server after changing `.env`.

Vite reads env files at server startup.

### Page Redirects Back To Login

Check:

- The access token exists in browser local storage.
- The backend `/api/auth/me/` endpoint returns the user.
- The returned user has a `modules` array for route access.

### Module Is Missing From Sidebar

Check:

- The backend user response includes the module name.
- `src/components/Sidebar.jsx` has a nav item for that module.
- `src/routes/AppRoutes.jsx` has a protected route for that module.

### Build Fails

Run:

```bash
node -v
npm -v
npm ci
npm run build
```

Make sure Node is `v22.23.1` and npm is `10.9.8`.
