# NavAR Platform

NavAR is rebuilt as a split platform:

- `backend/`: Node.js + Express API using clean architecture and PostgreSQL/PostGIS.
- `frontend/`: Next.js admin dashboard for operations, maps, routing, AR markers, heat map, and analytics.

## Quick Start

1. Create `.env` from `.env.example` and set `DATABASE_URL`.
2. Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

3. Prepare and seed PostgreSQL/PostGIS:

```bash
npm run db:init
npm run db:seed
```

4. Run the backend and frontend:

```bash
npm run dev
```

Backend: http://localhost:4000
Frontend: http://localhost:3000

## Important Docs

Read [`docs/ARCHITECTURE_AND_API.md`](docs/ARCHITECTURE_AND_API.md) for:

- Clean architecture folder structure.
- PostgreSQL/PostGIS schema.
- Extra operational tables for dashboard and mobile sync.
- API endpoint list and payload examples.
- How Unity phone SQLite should sync with the backend.
- Algorithms used now and recommended future algorithms.

## Main APIs

- `GET /api/admin/dashboard`
- `GET /api/navigation/path?startNode=1&endNode=6`
- `GET /api/mobile/bootstrap`
- `POST /api/mobile/navigation-sessions`
- `POST /api/mobile/sync`

The phone keeps SQLite for offline use. PostgreSQL is the source of truth for the web dashboard and central analytics.

## Admin Login

Run `npm run db:seed` to create the development admin account:

```text
Email: admin@navar.local
Password: Admin@12345
```

The website starts at `/login`. After login, it stores the admin token in local storage and sends it to protected backend endpoints as a bearer token.

Set `AUTH_SECRET` in `.env` before real deployment.
