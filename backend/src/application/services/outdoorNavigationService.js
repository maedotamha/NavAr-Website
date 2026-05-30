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
  if (!session) return null;
  return {
    id: session.session_id || session.id,
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

  function dataFromRows(rows) {
    return rows.map(row => row.data_json || {}).filter(Boolean);
  }

  async function rows(recordType, limit) {
    return repo.listSourceRecords(recordType, limit);
  }

  async function outdoorDbAnalytics(extra = {}) {
    const [statsRows, heatRows, destinationRows, routeRows, recentRows, searchRows] = await Promise.all([
      rows('analytics_stats', 1),
      rows('heatmap_point', 500),
      rows('destination', 500),
      rows('route', 500),
      rows('navigation_session', 500),
      rows('search_term', 200)
    ]);
    const stats = statsRows[0]?.data_json || {};
    const heatmap = heatRows.map(row => [
      Number(row.latitude ?? row.data_json?.lat),
      Number(row.longitude ?? row.data_json?.lng),
      Number(row.data_json?.weight ?? row.data_json?.count ?? row.data_json?.intensity ?? 1)
    ]).filter(point => point.every(Number.isFinite));
    return {
      configured: true,
      source: 'database',
      stats,
      heatmap,
      destinations: dataFromRows(destinationRows),
      routes: dataFromRows(routeRows),
      recent: dataFromRows(recentRows),
      searches: dataFromRows(searchRows),
      ...extra
    };
  }

  async function fetchAndSync(path, recordType, operation, normalizer = data => normalizeOutdoorPayload(recordType, data)) {
    const data = await fetchService.fetchJson(path);
    const records = normalizer(data);
    if (records.length) await syncService.syncRecords(records, operation);
    else await syncService.log('outdoor', operation, recordType, null, 'empty', { path });
    return data;
  }

  async function refresh(path, recordType, operation, normalizer) {
    try {
      await fetchAndSync(path, recordType, operation, normalizer);
      return null;
    } catch (error) {
      await syncService.log('outdoor', operation, recordType, null, 'error', { path, message: error.message });
      return error.message;
    }
  }

  return {
    async analytics() {
      const errors = (await Promise.all([
        refresh(ENDPOINTS.stats, 'analytics_stats', 'outdoor.stats.fetch', normalizeOutdoorStats),
        refresh(ENDPOINTS.heatmap, 'heatmap_point', 'outdoor.heatmap.fetch'),
        refresh(ENDPOINTS.destinations, 'destination', 'outdoor.destinations.fetch'),
        refresh(ENDPOINTS.routes, 'route', 'outdoor.routes.fetch'),
        refresh(ENDPOINTS.recent, 'navigation_session', 'outdoor.recent.fetch'),
        refresh(ENDPOINTS.searches, 'search_term', 'outdoor.searches.fetch')
      ])).filter(Boolean);
      return outdoorDbAnalytics(errors.length ? { sync_error: errors[0] } : {});
    },
    async sessions() {
      const error = await refresh(ENDPOINTS.recent, 'navigation_session', 'outdoor.sessions.fetch');
      const recent = dataFromRows(await rows('navigation_session', 500));
      return {
        source: 'database',
        sessions: recent.map(normalizeRecentSession).filter(Boolean),
        ...(error ? { sync_error: error } : {})
      };
    },
    async map() {
      const error = await refresh(ENDPOINTS.map, 'map_graph', 'outdoor.map.fetch', data => normalizeOutdoorPayload('map_graph', data));
      const maps = dataFromRows(await rows('map_graph', 10));
      return { source: 'database', map: maps[0] || null, ...(error ? { sync_error: error } : {}) };
    },
    async mapDestinations(query) {
      const error = await refresh(ENDPOINTS.mapDestinations + toQuery({ q: query.q, type: query.type }), 'destination', 'outdoor.map_destinations.fetch');
      const destinations = dataFromRows(await rows('destination', 500));
      return { source: 'database', destinations, ...(error ? { sync_error: error } : {}) };
    },
    async mapNodes(query) {
      const error = await refresh(ENDPOINTS.mapNodes + toQuery({ type: query.type }), 'map_node', 'outdoor.map_nodes.fetch');
      const nodes = dataFromRows(await rows('map_node', 500));
      return { source: 'database', nodes, ...(error ? { sync_error: error } : {}) };
    },
    async mapNode(id) {
      const error = await refresh('/api/map/nodes/' + encodeURIComponent(id), 'map_node', 'outdoor.map_node.fetch');
      const nodes = dataFromRows(await rows('map_node', 500));
      return { source: 'database', node: nodes.find(node => String(node.id) === String(id)) || null, ...(error ? { sync_error: error } : {}) };
    },
    async mapEdges(query) {
      const error = await refresh(ENDPOINTS.mapEdges + toQuery({ mode: query.mode }), 'map_edge', 'outdoor.map_edges.fetch');
      const edges = dataFromRows(await rows('map_edge', 500));
      return { source: 'database', edges, ...(error ? { sync_error: error } : {}) };
    },
    async route(query) {
      const recordType = 'computed_route';
      const error = await refresh(ENDPOINTS.route + toQuery({ fromId: query.fromId, toId: query.toId, mode: query.mode }), recordType, 'outdoor.route.fetch');
      const routes = dataFromRows(await rows(recordType, 100));
      return { source: 'database', route: routes[0] || null, ...(error ? { sync_error: error } : {}) };
    },
    async recentSearches() {
      const error = await refresh(ENDPOINTS.recentSearches, 'search_term', 'outdoor.recent_searches.fetch');
      const searches = dataFromRows(await rows('search_term', 200));
      return { source: 'database', searches, ...(error ? { sync_error: error } : {}) };
    }
  };
}

module.exports = createOutdoorNavigationService;
