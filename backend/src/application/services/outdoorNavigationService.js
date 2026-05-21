const AppError = require('../../domain/AppError');
const env = require('../../config/env');

const ENDPOINTS = {
  stats: '/api/admin/stats',
  heatmap: '/api/admin/heatmap',
  destinations: '/api/admin/destinations',
  routes: '/api/admin/routes',
  recent: '/api/admin/recent',
  searches: '/api/admin/searches',
  map: '/api/map',
  mapDestinations: '/api/map/destinations',
  mapNodes: '/api/map/nodes',
  mapEdges: '/api/map/edges',
  route: '/api/route',
  recentSearches: '/api/recent-searches'
};

function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const text = query.toString();
  return text ? '?' + text : '';
}

function assertConfigured() {
  if (!env.outdoorNavApiUrl) throw new AppError('OUTDOOR_NAV_API_URL is not configured', 503);
}

async function fetchOutdoor(path) {
  assertConfigured();
  const response = await fetch(env.outdoorNavApiUrl + path, { headers: { Accept: 'application/json' } });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    throw new AppError('Outdoor navigation API returned invalid JSON', 502);
  }
  if (!response.ok) throw new AppError(data?.error || 'Outdoor navigation API request failed', response.status);
  return data;
}

function normalizeRecentSession(session) {
  return {
    id: session.session_id,
    device_id: 'outdoor-app',
    session_scope: 'outside',
    start_name: session.from_name,
    end_name: session.to_name,
    distance_meters: session.route_length,
    duration_seconds: null,
    success: Number(session.completed) === 1 || session.completed === true,
    recovery_count: 0,
    client_created_at: session.started_at,
    completed_at: session.completed_at
  };
}

function createOutdoorNavigationService() {
  return {
    async analytics() {
      const [stats, heatmap, destinations, routes, recent, searches] = await Promise.all([
        fetchOutdoor(ENDPOINTS.stats),
        fetchOutdoor(ENDPOINTS.heatmap),
        fetchOutdoor(ENDPOINTS.destinations),
        fetchOutdoor(ENDPOINTS.routes),
        fetchOutdoor(ENDPOINTS.recent),
        fetchOutdoor(ENDPOINTS.searches)
      ]);
      return { configured: true, stats, heatmap, destinations, routes, recent, searches };
    },
    async sessions() {
      const recent = await fetchOutdoor(ENDPOINTS.recent);
      return { sessions: Array.isArray(recent) ? recent.map(normalizeRecentSession) : [] };
    },
    map: () => fetchOutdoor(ENDPOINTS.map),
    mapDestinations: query => fetchOutdoor(ENDPOINTS.mapDestinations + toQuery({ q: query.q, type: query.type })),
    mapNodes: query => fetchOutdoor(ENDPOINTS.mapNodes + toQuery({ type: query.type })),
    mapNode: id => fetchOutdoor('/api/map/nodes/' + encodeURIComponent(id)),
    mapEdges: query => fetchOutdoor(ENDPOINTS.mapEdges + toQuery({ mode: query.mode })),
    route: query => fetchOutdoor(ENDPOINTS.route + toQuery({ fromId: query.fromId, toId: query.toId, mode: query.mode })),
    recentSearches: () => fetchOutdoor(ENDPOINTS.recentSearches)
  };
}

module.exports = createOutdoorNavigationService;
