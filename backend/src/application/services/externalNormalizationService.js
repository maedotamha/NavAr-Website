const { compactObject, dedupeFromParts } = require('./externalMergeService');

function asArray(data, recordType) {
  return Array.isArray(data) ? data : (data ? [data] : []);
}

function normalizeOutdoorPayload(recordType, payload) {
  const keyedArrays = {
    heatmap_point: ['heatmap', 'points'],
    destination: ['destinations', 'results'],
    route: ['routes'],
    navigation_session: ['sessions', 'recent'],
    search_term: ['searches', 'recentSearches', 'terms'],
    map_node: ['nodes'],
    map_edge: ['edges']
  };
  const collection = keyedArrays[recordType]?.reduce((found, key) => found || payload?.[key], null) || payload;
  return asArray(collection, recordType).map((item, index) => {
    if (recordType === 'heatmap_point' && Array.isArray(item)) {
      const [lat, lng, weight] = item;
      return {
        source: 'outdoor',
        record_type: recordType,
        dedupe_key: dedupeFromParts([Number(lat).toFixed(6), Number(lng).toFixed(6)]),
        latitude: Number(lat),
        longitude: Number(lng),
        data_json: compactObject({ lat, lng, weight })
      };
    }
    const externalId = item.id || item.session_id || item.resultId || item.name || `${recordType}-${index}`;
    const name = item.name || item.toName || item.to_name || item.resultName || item.fromName || item.from_name || null;
    const lat = item.lat ?? item.latitude;
    const lng = item.lng ?? item.longitude;
    return {
      source: 'outdoor',
      record_type: recordType,
      dedupe_key: dedupeFromParts([externalId || name, lat, lng]),
      external_id: externalId ? String(externalId) : null,
      name,
      latitude: lat !== undefined ? Number(lat) : null,
      longitude: lng !== undefined ? Number(lng) : null,
      data_json: compactObject(item)
    };
  }).filter(record => record.dedupe_key);
}

function normalizeOutdoorStats(stats) {
  return [{
    source: 'outdoor',
    record_type: 'analytics_stats',
    dedupe_key: 'current',
    external_id: 'current',
    name: 'Outdoor analytics stats',
    data_json: compactObject(stats || {})
  }];
}

module.exports = { normalizeOutdoorPayload, normalizeOutdoorStats };
