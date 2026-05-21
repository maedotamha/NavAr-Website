# NavAR Backend, Database, Mobile Sync, and Algorithms

## Architecture

The backend follows a clean architecture style so business logic is separated from Express and PostgreSQL.

```text
backend/src
  config/                 Environment loading
  domain/                 App errors, validators, routing algorithms
  application/services/   Use cases for dashboard, catalog, mobile sync, navigation
  infrastructure/         PostgreSQL connection and repositories
  interfaces/http/        Express routes, controllers, middleware
  compositionRoot.js      Wires services to repositories and controllers
  server.js               HTTP app startup only
```

Dependency direction:

```text
HTTP controllers -> application services -> domain logic
                                -> repository implementation -> PostgreSQL
```

The Next.js frontend and Unity mobile app only call HTTP endpoints. They do not connect directly to PostgreSQL.

## Database Connection

Create `.env` from `.env.example`:

```env
DATABASE_URL=postgres://postgres:your_password@localhost:5432/navar
BACKEND_PORT=4000
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Then run:

```bash
npm install --prefix backend
npm install --prefix frontend
npm run db:init
npm run db:seed
npm run dev
```

The backend uses `pg` and PostGIS. Coordinates are stored as `GEOGRAPHY(Point, 4326)` and returned as `latitude` and `longitude`.

## Core Tables

Your four tables are the source of the indoor navigation graph and AR anchors: `buildings`, `navigation_nodes`, `routes`, and `ar_markers`.

The migration keeps those tables and adds practical metadata columns like timestamps, `floor_label`, `node_type`, `linked_node`, marker `status`, and route `is_accessible`.

## Added Operational Tables

### navigation_sessions

Stores route usage sent from the Unity app.

```sql
CREATE TABLE navigation_sessions (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(120),
  start_node INTEGER REFERENCES navigation_nodes(id),
  end_node INTEGER REFERENCES navigation_nodes(id),
  duration_seconds INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  recovery_count INTEGER DEFAULT 0,
  client_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This powers heat maps, route success, recovery events, popular destinations, and usage analytics.

### visit_series

Stores cached daily dashboard aggregates.

```sql
CREATE TABLE visit_series (
  id SERIAL PRIMARY KEY,
  day DATE UNIQUE NOT NULL,
  route_requests INTEGER DEFAULT 0,
  successful_routes INTEGER DEFAULT 0
);
```

In production, this can be generated from `navigation_sessions` with a scheduled job.

## Indexes

```sql
CREATE INDEX idx_buildings_location ON buildings USING GIST(location);
CREATE INDEX idx_navigation_nodes_location ON navigation_nodes USING GIST(location);
CREATE INDEX idx_ar_markers_location ON ar_markers USING GIST(location);
CREATE INDEX idx_routes_start_end ON routes(start_node, end_node);
CREATE INDEX idx_sessions_created_at ON navigation_sessions(created_at);
```

## API Endpoints

Base URL: `http://localhost:4000/api`

- `GET /api/health`
- `GET /api/buildings`
- `POST /api/buildings`
- `GET /api/navigation-nodes`
- `POST /api/navigation-nodes`
- `GET /api/routes`
- `POST /api/routes`
- `GET /api/ar-markers`
- `POST /api/ar-markers`
- `GET /api/admin/dashboard`
- `GET /api/navigation/path?startNode=1&endNode=6`
- `GET /api/navigation/nearest-node?latitude=8.88951&longitude=38.80984`
- `GET /api/mobile/bootstrap`
- `GET /api/mobile/nearest-node?latitude=8.88951&longitude=38.80984`
- `POST /api/mobile/navigation-sessions`
- `POST /api/mobile/sync`

## Example Payloads

Create a building:

```json
{
  "name": "AASTU RTC/RD Block F",
  "description": "Indoor AR navigation pilot building",
  "longitude": 38.81016,
  "latitude": 8.88966
}
```

Create a navigation node:

```json
{
  "node_name": "Main Entrance Lobby",
  "longitude": 38.80984,
  "latitude": 8.88951
}
```

Create a route edge:

```json
{
  "start_node": 1,
  "end_node": 2,
  "distance": 12.4
}
```

Create an AR marker:

```json
{
  "marker_name": "QR-ENT-001",
  "longitude": 38.80984,
  "latitude": 8.88951,
  "model_path": "/models/entrance.glb"
}
```

Upload one mobile session:

```json
{
  "device_id": "phone-001",
  "start_node": 1,
  "end_node": 4,
  "duration_seconds": 95,
  "success": true,
  "recovery_count": 0,
  "client_created_at": "2026-05-16T09:00:00Z"
}
```

Bulk sync offline mobile sessions:

```json
{
  "sessions": [
    {
      "device_id": "phone-001",
      "start_node": 1,
      "end_node": 4,
      "duration_seconds": 95,
      "success": true,
      "recovery_count": 0,
      "client_created_at": "2026-05-16T09:00:00Z"
    }
  ]
}
```

## Phone SQLite Sync

The backend does not directly connect to the phone SQLite database. The phone keeps SQLite for offline mode and syncs through HTTP.

```text
PostgreSQL source of truth
        -> GET /api/mobile/bootstrap
Unity local SQLite cache
        -> POST /api/mobile/navigation-sessions or /api/mobile/sync
Node backend
        -> PostgreSQL analytics tables
        -> Next.js admin dashboard
```

Recommended SQLite tables on the phone:

```text
local_buildings
local_navigation_nodes
local_routes
local_ar_markers
pending_navigation_sessions
sync_metadata
```

When offline, Unity writes sessions to `pending_navigation_sessions`. When online, it posts them to `/api/mobile/sync` and deletes local pending rows after the server accepts them.

## Algorithms Needed

### Shortest Path Routing

Needed now. Implemented with Dijkstra using `routes.distance` as the weight.

Dijkstra is a good first choice because the indoor map is a weighted graph and the schema already stores edge distances. Later, A* can replace it if we add reliable indoor x/y/floor coordinates and a heuristic.

### Nearest Node / Map Matching

Needed now. Implemented with PostGIS distance. The phone can send a coordinate or AR marker estimate and the backend identifies the closest navigation node.

Future improvement: snap to route segments or corridors, not only the closest node.

### Heat Map Aggregation

Needed for the dashboard. Current heat points count sessions connected to each node.

Future improvement: filter by date range, floor, building, POI category, and route segment.

### QR / AR Marker Localization

Needed for mobile. Each marker should either link directly to a node or be mapped to the nearest node.

Future improvement: marker scan counts, confidence scores, marker health, stale-marker alerts.

### Offline Sync Idempotency

Needed before deployment. The current sync accepts uploaded sessions. Later, add client event IDs so duplicate uploads do not create duplicate server records.

Recommended future table:

```sql
CREATE TABLE mobile_sync_events (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(120),
  client_event_id VARCHAR(120) UNIQUE,
  event_type VARCHAR(80),
  payload JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
```

## What Still Needs Real Project Data

The seed data is demo data. Production navigation still needs exact node lists, QR-to-node mappings, route distances, floor transitions, accessibility metadata, POI categories, room names, and the actual Unity SQLite field names.

## Website Authentication

The website admin dashboard now uses token-based authentication.

### admin_users

```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(80) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Passwords are hashed with Node's built-in `crypto.scryptSync`. The backend returns a signed HMAC token after login. Set a strong `AUTH_SECRET` in `.env` before deployment.

Development seed account:

```text
Email: admin@navar.local
Password: Admin@12345
```

Change this before any real deployment.

### Auth Endpoints

```http
POST /api/auth/login
GET /api/auth/me
```

Login payload:

```json
{
  "email": "admin@navar.local",
  "password": "Admin@12345"
}
```

Login response:

```json
{
  "token": "signed-token",
  "admin": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@navar.local",
    "role": "admin"
  },
  "expires_in": 28800
}
```

The frontend stores the token in browser local storage as `navarAdminToken` and sends it as:

```http
Authorization: Bearer signed-token
```

### Protected Routes

These routes require an admin token:

```text
GET /api/auth/me
GET/POST /api/buildings
GET/POST /api/navigation-nodes
GET/POST /api/routes
GET/POST /api/ar-markers
GET /api/admin/dashboard
GET /api/navigation/path
GET /api/navigation/nearest-node
```

Mobile routes remain public for now because the Unity app will need a separate device/app authentication model:

```text
GET /api/mobile/bootstrap
GET /api/mobile/nearest-node
POST /api/mobile/navigation-sessions
POST /api/mobile/sync
```

Before production, mobile routes should use an app API key, device registration token, or signed mobile sync token.

### `.env` location

The backend now loads environment variables from both locations:

```text
NavAr-Website/.env
NavAr-Website/backend/.env
```

If both exist, `backend/.env` overrides the root value for backend runs. The frontend still needs `NEXT_PUBLIC_API_URL`; keep that in the root `.env` or `frontend/.env.local` when running the Next app.
