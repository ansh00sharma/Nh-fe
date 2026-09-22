# TaskFlow Frontend

TaskFlow Frontend is a Vite + React single-page application for the TaskFlow task management product. It connects to the Django REST backend, handles JWT-based login, protects routes, and renders role-based modules for dashboard, users, projects, and tasks.

## Core Functionality

- Login screen with JWT authentication.
- Local auth-session storage for access token, refresh token, and user metadata.
- Protected application shell after login.
- Role/module based navigation.
- Dashboard placeholder for future reporting.
- User management UI.
- Project management UI.
- Task management UI with filters, pagination, tabs, status updates, create/edit/delete flows, and due-date formatting.
- Centralized backend API client.
- Shared layout, navbar, sidebar, and delete confirmation modal.
- Tailwind CSS styling through Vite.

## Tech Stack

- React 19
- React Router 7
- Vite 8
- Tailwind CSS 4
- Native `fetch` for API calls
- Browser `localStorage` for auth session persistence

## Code Structure

```text
Nh-fe/
  public/
    assets/
  src/
    api/
    assets/
    components/
    layouts/
    pages/
    routes/
    utils/
    App.jsx
    main.jsx
    index.css
  .env.example
  .nvmrc
  index.html
  package.json
  vite.config.js
```

## Important Root Files

### `package.json`

Defines project metadata, dependencies, and npm scripts.

Scripts:

- `npm run dev`: start local Vite dev server.
- `npm run build`: build production assets into `dist/`.
- `npm run preview`: preview the production build locally.

### `.nvmrc`

Pins the expected Node version:

```text
22.23.1
```

### `.env.example`

Documents the frontend environment variable used to connect to the backend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Because this is a Vite variable, it must start with `VITE_` to be available in browser code. Do not put private secrets in Vite frontend environment variables because they are included in the built client bundle.

### `vite.config.js`

Configures the React and Tailwind CSS Vite plugins.

## Application Entry

### `src/main.jsx`

The browser entry point.

Responsibilities:

- Imports global CSS.
- Creates the React root.
- Wraps the app in `BrowserRouter`.
- Renders `App` inside `StrictMode`.

### `src/App.jsx`

Small app component that delegates all routing to `AppRoutes`.

## Routing

Routing lives in `src/routes/`.

### `src/routes/AppRoutes.jsx`

Defines top-level routes:

- `/login`
- `/dashboard`
- `/users`
- `/projects`
- `/tasks`

It also redirects `/` and unknown routes to `/login`.

### `src/routes/ProtectedRoute.jsx`

Checks whether an access token exists in local storage. If no token exists, the user is redirected to `/login`.

### `src/routes/ModuleRoute.jsx`

Checks whether the logged-in user has access to a specific module based on the backend-provided `modules` array. If access is missing, the user is redirected to their default authenticated route.

## API Layer

API calls live in `src/api/`.

### `src/api/client.js`

Central API request helper.

Responsibilities:

- Reads `VITE_API_BASE_URL`.
- Normalizes trailing slashes on the base URL.
- Builds full request URLs.
- Adds JSON headers when a request body exists.
- Adds Bearer token authorization when provided.
- Parses JSON responses.
- Throws `ApiError` for non-2xx responses.

All backend modules should use this client instead of calling `fetch` directly.

### `src/api/auth.js`

Authentication and session helpers.

Responsibilities:

- Login.
- Fetch current user.
- Logout from backend.
- Save/clear auth session.
- Read access and refresh tokens.
- Read stored user, role, and modules.
- Check module access.
- Resolve the default route after login.
- Generate user initials for the navbar avatar.

Local storage keys:

- `taskflow_access_token`
- `taskflow_refresh_token`
- `taskflow_user`

### `src/api/projects.js`

Project API wrapper for list, create, update, and delete calls.

### `src/api/tasks.js`

Task API wrapper for list, create, update, and delete calls. `getTasks` accepts filter and pagination parameters and converts them into query string values.

### `src/api/users.js`

User API wrapper for list, create, update, and delete calls.

## Layout And Shared Components

### `src/layouts/AppLayout.jsx`

Authenticated application shell.

Responsibilities:

- Loads the current user from local storage.
- Refreshes current user details from the backend.
- Saves updated user data back to the auth session.
- Renders `Navbar`, `Sidebar`, and the active page through `Outlet`.
- Maintains sidebar collapsed state.

### `src/components/Navbar.jsx`

Top navigation bar.

Responsibilities:

- Shows the TaskFlow brand.
- Shows user initials.
- Opens/closes the profile menu.
- Calls backend logout and local logout cleanup.

### `src/components/Sidebar.jsx`

Role-aware module navigation.

Responsibilities:

- Defines available sidebar navigation items.
- Filters visible items using the user `modules` array.
- Supports collapsed and expanded states.
- Highlights active routes.

To add a new module, update:

1. Backend user `modules` response.
2. `AppRoutes.jsx` route.
3. `Sidebar.jsx` nav item.
4. A page under `src/pages/`.
5. An API wrapper under `src/api/` if the module talks to the backend.

### `src/components/DeleteConfirmationModal.jsx`

Reusable confirmation modal for delete flows.

Used by:

- Projects page.
- Tasks page.
- Users page.

## Pages

Pages live in `src/pages/`.

### `src/pages/Login.jsx`

Login experience.

Responsibilities:

- Captures username/email and password.
- Calls login API.
- Fetches current user after successful login.
- Saves tokens and user data.
- Redirects to the user's default module.
- Shows login errors and loading state.

### `src/pages/Dashboard.jsx`

Admin dashboard placeholder intended for future reporting and overview widgets.

### `src/pages/Users.jsx`

User management module.

Responsibilities:

- Lists users.
- Creates users.
- Edits users.
- Deletes users with confirmation.
- Handles form validation.
- Handles auth errors by logging the user out.
- Formats timestamps in IST.

### `src/pages/Projects.jsx`

Project management module.

Responsibilities:

- Lists projects.
- Creates projects.
- Edits projects.
- Deletes projects with confirmation.
- Handles form validation.
- Handles auth errors by logging the user out.
- Formats timestamps in IST.

### `src/pages/Tasks.jsx`

Task management module.

Responsibilities:

- Lists tasks.
- Supports assigned/created tabs for users that can manage tasks.
- Supports filters for status, assignee, and due-date range.
- Supports pagination and page-size selection.
- Creates tasks.
- Edits tasks.
- Deletes tasks with confirmation.
- Updates task status.
- Converts local IST date-time input into UTC ISO strings for the backend.
- Formats backend timestamps in IST.

## Utilities

### `src/utils/datetime.js`

Date/time helpers.

Responsibilities:

- Format backend timestamps in Asia/Kolkata time.
- Convert backend timestamps to values usable by `datetime-local` inputs.
- Convert IST `datetime-local` values back to UTC ISO strings before sending to the backend.

## Styling

### `src/index.css`

Global stylesheet.

Responsibilities:

- Imports Tailwind CSS.
- Sets base page and root styles.
- Defines custom login-page visual styles and animations.
- Disables animations when `prefers-reduced-motion` is enabled.

Most component styling is maintained directly in JSX with Tailwind utility classes.

## Environment And Backend Connection

The app reads the backend base URL from:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Local development should use a `.env` file. CI/CD should inject the same key from GitHub Actions secrets.

Example production value:

```env
VITE_API_BASE_URL=https://api.example.com
```

Do not add a trailing slash.

## Maintenance Notes

- Keep backend endpoint paths inside `src/api/*` wrappers, not scattered through page components.
- Keep auth/session behavior inside `src/api/auth.js`.
- Keep route access checks inside `src/routes/`.
- Keep shared app shell behavior inside `src/layouts/AppLayout.jsx`.
- Keep reusable UI in `src/components/`.
- Keep page-specific data loading, forms, filters, modals, and table state inside the relevant page.
- When backend response shapes change, update the API wrapper first, then the page.
- When backend modules change, update route guards and sidebar module names together.
- When adding private configuration, do not place it in `VITE_*` variables because frontend environment values are public in the browser bundle.
