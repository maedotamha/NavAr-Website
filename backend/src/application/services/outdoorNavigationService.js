const env = require('../../config/env');
const createExternalFetchService = require('./externalFetchService');
const createDatabaseSyncService = require('./databaseSyncService');
const { normalizeOutdoorPayload, normalizeOutdoorStats } = require('./externalNormalizationService');

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

function createOutdoorNavigationService(repo) {
  const fetchService = createExternalFetchService({ baseUrl: env.outdoorNavApiUrl, source: 'outdoor' });
  const syncService = createDatabaseSyncService(repo);
  async function fetchAndSync(path, recordType, operation, normalizer = data => normalizeOutdoorPayload(recordType, data)) {
    const data = await fetchService.fetchJson(path);
    const records = normalizer(data);
    if (records.length) await syncService.syncRecords(records, operation);
    else await syncService.log('outdoor', operation, recordType, null, 'empty', { path });
    return data;
  }
  return {
    async analytics() {
      const [stats, heatmap, destinations, routes, recent, searches] = await Promise.all([
        fetchAndSync(ENDPOINTS.stats, 'analytics_stats', 'outdoor.stats.fetch', normalizeOutdoorStats),
        fetchAndSync(ENDPOINTS.heatmap, 'heatmap_point', 'outdoor.heatmap.fetch'),
        fetchAndSync(ENDPOINTS.destinations, 'destination', 'outdoor.destinations.fetch'),
        fetchAndSync(ENDPOINTS.routes, 'route', 'outdoor.routes.fetch'),
        fetchAndSync(ENDPOINTS.recent, 'navigation_session', 'outdoor.recent.fetch'),
        fetchAndSync(ENDPOINTS.searches, 'search_term', 'outdoor.searches.fetch')
      ]);
      return { configured: true, stats, heatmap, destinations, routes, recent, searches };
    },
    async sessions() {
      const recent = await fetchAndSync(ENDPOINTS.recent, 'navigation_session', 'outdoor.sessions.fetch');
      return { sessions: Array.isArray(recent) ? recent.map(normalizeRecentSession) : [] };
    },
    map: () => fetchAndSync(ENDPOINTS.map, 'map_graph', 'outdoor.map.fetch', data => normalizeOutdoorPayload('map_graph', data)),
    mapDestinations: query => fetchAndSync(ENDPOINTS.mapDestinations + toQuery({ q: query.q, type: query.type }), 'destination', 'outdoor.map_destinations.fetch'),
    mapNodes: query => fetchAndSync(ENDPOINTS.mapNodes + toQuery({ type: query.type }), 'map_node', 'outdoor.map_nodes.fetch'),
    mapNode: id => fetchAndSync('/api/map/nodes/' + encodeURIComponent(id), 'map_node', 'outdoor.map_node.fetch'),
    mapEdges: query => fetchAndSync(ENDPOINTS.mapEdges + toQuery({ mode: query.mode }), 'map_edge', 'outdoor.map_edges.fetch'),
    route: query => fetchAndSync(ENDPOINTS.route + toQuery({ fromId: query.fromId, toId: query.toId, mode: query.mode }), 'computed_route', 'outdoor.route.fetch'),
    recentSearches: () => fetchAndSync(ENDPOINTS.recentSearches, 'search_term', 'outdoor.recent_searches.fetch')
  };
}

module.exports = createOutdoorNavigationService;
