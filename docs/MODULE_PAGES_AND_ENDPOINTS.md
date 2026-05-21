# NavAR Admin Modules, Pages, and API Sources

This document defines the admin sidebar pages after module consolidation. Navigation and map management are intentionally excluded from the admin module list because navigation belongs to the mobile app experience and raw map/CAD handling is not useful or safe in daily admin workflows.

## Dashboard

Purpose: one place for operational analytics, system status, and heat-map visibility.

Pages:
- Overview
- Heat Map

Shows:
- Active sessions
- QR scan trends
- Route success rate
- Popular destinations
- Campus heat map by block/location
- Recovery hotspots and failed route areas
- API/database/mobile sync status

API sources:
- `GET /api/admin/dashboard`
- `GET /api/health`
- `POST /api/mobile/navigation-sessions`
- `POST /api/mobile/sync`

Future endpoint:
- `GET /api/admin/heat-map`

## Sessions

Purpose: inspect navigation sessions submitted by the mobile app.

Pages:
- Inside Navigation
- Outside Navigation

Shows:
- Device/session id
- Start node and destination node
- Duration
- Success or abandoned status
- Recovery count
- Last mobile sync time
- Inside navigation context: QR anchor, room, floor, facility, POI
- Outside navigation context: block, entrance, parking, exterior destination
- Failed route and recovery context inside each session type

API sources:
- `POST /api/mobile/navigation-sessions`
- `POST /api/mobile/sync`
- `GET /api/mobile/navigation-sessions?scope=inside`
- `GET /api/mobile/navigation-sessions?scope=outside`
- `GET /api/outdoor/sessions`
- `GET /api/outdoor/analytics`

Mobile payload:
- Send `session_scope: "inside"` for indoor/QR/POI room-to-room navigation.
- Send `session_scope: "outside"` for campus/block/entrance/parking navigation.
- The API also accepts `navigation_scope`, `scope`, or `navigation_type` as aliases.

Outdoor navigation source:
- Set `OUTDOOR_NAV_API_URL` on the backend to the AASTU Navigator backend base URL.
- The admin dashboard proxies outdoor analytics from `/api/admin/stats`, `/api/admin/heatmap`, `/api/admin/destinations`, `/api/admin/routes`, `/api/admin/recent`, and `/api/admin/searches`.
- The website exposes those through protected admin endpoints under `/api/outdoor/*`.

## QR Codes

Purpose: manage QR anchors used by the mobile app for positioning.

Pages:
- QR Registry
- Scan History

Shows:
- QR code id
- Marker name
- Assigned block/floor/location
- Linked navigation node
- Online/offline status
- Scan count and last scan time

API sources:
- `GET /api/ar-markers`
- `GET /api/mobile/bootstrap`

Future endpoints:
- `GET /api/admin/qr-scans`
- `PATCH /api/ar-markers/:id/status`

## Points of Interest

Purpose: manage searchable destinations shown in the mobile app.

Pages:
- POI Directory

Shows:
- POI name
- Category
- Block/floor
- Linked navigation node
- Visibility status
- Staff-only or public destination state

API sources:
- `GET /api/navigation-nodes`
- `POST /api/navigation-nodes`
- `GET /api/mobile/bootstrap`

Future endpoints:
- `PATCH /api/points-of-interest/:id/visibility`

## Locations

Purpose: manage structured campus spaces. This merges Blocks and Facilities.

Pages:
- Blocks & Floors
- Rooms & Facilities

Shows:
- Blocks
- Floors
- Rooms
- Offices
- Labs
- Restrooms
- Entrances/exits
- Stairs/elevators
- Nearest node and assigned QR anchor

API sources:
- `GET /api/buildings`
- `POST /api/buildings`
- `GET /api/navigation-nodes`
- `GET /api/ar-markers`
- `GET /api/mobile/bootstrap`

Future endpoint:
- `GET /api/admin/locations`

## Users & Roles

Purpose: manage admin users, roles, and permissions.

Pages:
- Users
- Roles
- Permissions

Shows:
- Admin users
- Role assignment
- Active/inactive status
- Role permission matrix
- Module actions

API sources:
- `GET /api/access-control`
- `POST /api/access-control/users`
- `PUT /api/access-control/users/:id`
- `DELETE /api/access-control/users/:id`
- `POST /api/access-control/roles`
- `PUT /api/access-control/roles/:id`
- `DELETE /api/access-control/roles/:id`
- `PATCH /api/access-control/users/:id/role`

## Access Control

Purpose: control sensitive areas and audit privileged access.

Pages:
- Restricted Locations
- Access Logs

Shows:
- Restricted locations
- Allowed roles
- Access reason
- Audit events
- Actor, action, target, timestamp

API sources:
- `GET /api/access-control`

Future endpoints:
- `GET /api/admin/restricted-locations`
- `POST /api/admin/restricted-locations`
- `GET /api/admin/access-logs`

## Feedback

Purpose: review mobile-user feedback, route issues, and navigation ratings.

Pages:
- Feedback Inbox
- Route Issues & Ratings

Shows:
- Feedback message
- Issue type
- Related session id
- Related QR/location/node
- Rating score
- Status workflow: open, reviewing, resolved
- Assigned owner

Future mobile endpoint:
- `POST /api/mobile/feedback`

Future admin endpoints:
- `GET /api/admin/feedback`
- `GET /api/admin/feedback/route-issues`
- `GET /api/admin/feedback/ratings`
- `PATCH /api/admin/feedback/:id/status`

## Settings

Purpose: configure organization, security, and session behavior.

Pages:
- Organization
- Security & Sessions

Shows:
- Organization name
- Campus label
- Support contact
- Timezone
- Session timeout
- Sync interval
- Token TTL
- Password/security rules

Future endpoints:
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `GET /api/admin/settings/organization`
- `GET /api/admin/settings/security`
