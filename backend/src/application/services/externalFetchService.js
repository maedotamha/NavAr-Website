const AppError = require('../../domain/AppError');

function createExternalFetchService({ baseUrl, source }) {
  const root = String(baseUrl || '').replace(/\/+$/, '');
  async function fetchJson(path) {
    if (!root) throw new AppError(`${source} API base URL is not configured`, 503);
    const response = await fetch(root + path, { headers: { Accept: 'application/json' } });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_error) {
      throw new AppError(`${source} API returned invalid JSON`, 502);
    }
    if (!response.ok) throw new AppError(data?.error || `${source} API request failed`, response.status);
    return data;
  }
  return { fetchJson };
}

module.exports = createExternalFetchService;
