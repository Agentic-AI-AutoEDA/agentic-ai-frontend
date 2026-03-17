# Agentic AI Frontend

A React + Vite frontend for an Agentic AI-powered Exploratory Data Analysis (EDA) platform.

This app lets users:
- register/login,
- upload and preview datasets,
- configure analysis agents,
- generate and confirm schema + semantic metadata,
- run asynchronous EDA jobs,
- monitor job status/history,
- and inspect rich EDA results (summary, quality, insights, charts, and raw JSON).

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 7
- **Routing:** `react-router`
- **HTTP Client:** Axios
- **Charts:** Recharts
- **JSON Editing:** Monaco Editor (`@monaco-editor/react`)
- **Auth Utility:** `jwt-decode`
- **Linting:** ESLint 9

## Project Structure

```text
src/
  api.js                    # Axios instance + auth header interceptor
  constants.js              # BASE_URL and localStorage token keys
  App.jsx                   # Main router and route guards

  components/
    Form.jsx                # Shared login/register form
    files/                  # File list + file detail views
    agents/                 # Agent CRUD + schema/semantic metadata UI
    eda/                    # Run EDA, poll status, history, result rendering

  routes/
    ProtectedRoute.jsx      # Blocks unauthenticated access
    PublicRoute.jsx         # Redirects authenticated users away from auth pages
    Files.jsx, Agents.jsx, RunAnalysis.jsx

  pages/
    Main.jsx, Home.jsx, Login.jsx, Register.jsx, Profile.jsx
```

## Core Features

### 1) Authentication
- Login and registration screens use shared `Form` component.
- Tokens are stored in `localStorage` using keys:
  - `access`
  - `refresh`
- Protected pages use `useAuth` hook:
  - checks access token expiry,
  - refreshes token via backend,
  - redirects to `/login` if unauthorized.

### 2) Data Source Management
- Upload CSV files.
- List available files with owner + created timestamp.
- Hover preview of dataset header/sample rows.
- Full file table view with basic CSV parsing fallback (`utf-8` then `latin1`).
- Delete uploaded files.

### 3) Agent Management
- Create, edit, list, view, and delete agents.
- Bind an agent to an uploaded dataset.
- Auto-trigger schema generation after agent creation.

### 4) Schema and Semantic Metadata Workflow
- View generated schema metadata.
- Regenerate metadata if needed.
- Edit JSON metadata in Monaco editor.
- Confirm schema metadata.
- Generate and confirm semantic metadata.

### 5) EDA Execution and Monitoring
- Start EDA run from selected agent with optional context:
  - goal,
  - target column,
  - dataset domain,
  - dataset description.
- Poll job status periodically.
- Navigate to result page automatically when completed.
- View sortable job history with progress bars.

### 6) EDA Result Exploration
- Tabbed result sections:
  - Summary
  - Data Quality
  - Analysis
  - Insights
  - Charts
  - Raw JSON
- Handles variable backend payload shapes gracefully.

## Application Routes

### Public Routes
- `/` -> landing page
- `/login` -> login form
- `/register` -> register form

### Protected Routes
- `/home`
- `/files/*`
  - `/files/`
  - `/files/file-detail/:fileName`
- `/agents/*`
  - `/agents/`
  - `/agents/create`
  - `/agents/agent-detail/:agentId`
  - `/agents/edit/:agentId`
  - `/agents/schema/:agentId`
  - `/agents/schema/:agentId/edit`
  - `/agents/semantic/:agentId`
  - `/agents/semantic/:agentId/edit`
- `/eda/*`
  - `/eda/`
  - `/eda/history`
  - `/eda/status/:jobId`
  - `/eda/result/:jobId`
- `/profile`
- `/logout`

### Fallback
- `*` -> Not Found page

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/
```

Notes:
- `VITE_API_BASE_URL` is read in `src/constants.js`.
- Include trailing slash if your backend URLs are slash-terminated.

## Local Development Setup

### Prerequisites
- Node.js 20+
- npm 9+
- Backend API running and reachable

### Install and Run

```powershell
npm install
npm run dev
```

Vite dev server default URL:
- `http://localhost:5173`

## Available Scripts

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

- `dev`: start Vite dev server
- `build`: create production build in `dist/`
- `preview`: serve production build locally
- `lint`: run ESLint

## Docker Development

This repository includes:
- `Dockerfile` (Node 20 Alpine, runs Vite dev server)
- `docker-compose.yml` (bind mount for live reload)

### 1) Ensure external Docker network exists

`docker-compose.yml` expects an external network named `agentic-ai-network`.

```powershell
docker network create agentic-ai-network
```

### 2) Build and start frontend container

```powershell
docker compose up --build
```

The app will be available at:
- `http://localhost:5173`

## Backend API Contract (Expected by Frontend)

The frontend currently calls these endpoint patterns:

### Auth
- `POST users/register/`
- `POST users/login/`
- `POST user/token/refresh/`

### Files
- `GET resources/files/`
- `POST resources/files/upload/`
- `DELETE resources/files/:id/delete/`
- `GET resources/files/:id/preview/`
- `GET resources/files/:id/read/`

### Agents
- `GET agents/`
- `POST agents/`
- `GET agents/:id/`
- `PUT agents/:id/`
- `DELETE agents/:id/`

### Agent Metadata
- `GET agents/:id/metadata/schema/`
- `PUT agents/:id/metadata/schema/`
- `POST agents/:id/metadata/schema/generate/`
- `POST agents/:id/metadata/schema/confirm/`
- `GET agents/:id/metadata/semantic/`
- `PUT agents/:id/metadata/semantic/`
- `POST agents/:id/metadata/semantic/generate/`
- `POST agents/:id/metadata/semantic/confirm/`

### EDA Jobs
- `POST eda/start/:agentId/`
- `GET eda/status/:jobId/`
- `GET eda/history/`
- `GET eda/result/:jobId/`

## Authentication and Request Flow

- All API requests use `src/api.js` Axios client.
- Access token (if present) is attached as:
  - `Authorization: Bearer <token>`
- Route guards:
  - `ProtectedRoute` allows only authenticated users.
  - `PublicRoute` redirects authenticated users to `/home`.

## Known Notes

- `Profile` page (`src/pages/Profile.jsx`) is currently a placeholder.
- Result rendering in `EdaResult` intentionally tolerates varying backend response shapes.
- File details view has manual CSV parsing logic and may not fully support complex quoted edge cases.

## Troubleshooting

### App cannot call backend
- Verify `.env` exists and `VITE_API_BASE_URL` is correct.
- Ensure backend is running and CORS is configured for frontend origin.
- Restart dev server after changing `.env`.

### Unauthorized or redirect loops
- Clear stale tokens from browser storage.
- Confirm backend token refresh endpoint is `user/token/refresh/`.

### Docker compose fails with network error
- Create required external network:

```powershell
docker network create agentic-ai-network
```

### Port conflict on 5173
- Stop conflicting process or remap port in `docker-compose.yml`.

## Development Recommendations

- Run lint before pushing changes:

```powershell
npm run lint
```

- Build-check production artifacts:

```powershell
npm run build
npm run preview
```

## License

No license file is currently included in this repository. Add a `LICENSE` file if you want to define usage terms.

