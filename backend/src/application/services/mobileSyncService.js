const { integer, number, text } = require('../../domain/validators');

function normalizeSessionScope(input){
  const raw = input.session_scope || input.navigation_scope || input.scope || 'inside';
  return String(raw).toLowerCase().includes('outside') ? 'outside' : 'inside';
}

function nullableInteger(value, field){
  if(value === undefined || value === null || value === '') return null;
  return integer(Number(value), field);
}

function normalizeVisitedNodeIds(input){
  const raw = input.visited_node_ids || input.visitedNodeIds || [];
  return Array.isArray(raw) ? raw.map(item => String(item)).filter(Boolean) : [];
}

// Strip internal/sensitive fields from DB row before returning to mobile
function sanitize(row){
  if(!row) return null;
  const { success, device_id, start_node, end_node, recovery_count, ...rest } = row;
  // rename id → session_id for clarity
  const { id, ...without_id } = rest;
  return { session_id: id, ...without_id };
}

function sessionArray(input){
  if(Array.isArray(input)) return input;
  if(Array.isArray(input.sessions)) return input.sessions;
  return [input];
}

function createMobileSyncService(repo){
  return {

    async bootstrap(){
      const [buildings, nodes, routes, markers] = await Promise.all([
        repo.listBuildings(), repo.listNodes(), repo.listRoutes(), repo.listMarkers()
      ]);
      return { buildings, nodes, routes, markers, server_time: new Date().toISOString() };
    },

    // POST /mobile/navigation-sessions/start
    // Each item: { qr_id, started_at, session_scope? }
    async startSessions(input){
      const items = sessionArray(input);
      const saved = [];
      for(const item of items){
        const row = await repo.createSession({
          session_scope: normalizeSessionScope(item),
          qr_id: text(item.qr_id || item.qrId, 'qr_id', 120),
          status: 'started',
          success: true,
          visited_node_ids: [],
          client_created_at: item.started_at || item.client_created_at || null
        });
        saved.push(sanitize(row));
      }
      return saved;
    },

    // POST /mobile/navigation-sessions/end
    // Each item: { session_id, qr_id, visited_node_ids, destination_node_id?, ended_at? }
    async endSessions(input){
      const items = sessionArray(input);
      const saved = [];
      for(const item of items){
        const sessionId = nullableInteger(item.session_id || item.id, 'session_id');
        const update = {
          session_scope: normalizeSessionScope(item),
          qr_id: item.qr_id || item.qrId || null,
          end_node: nullableInteger(
            item.destination_node_id || item.destinationNodeId || item.end_node, 'destination_node_id'
          ),
          status: 'completed',
          success: true,
          visited_node_ids: normalizeVisitedNodeIds(item),
          client_created_at: item.ended_at || item.client_created_at || null
        };
        if(sessionId){
          const row = await repo.updateSession(sessionId, update);
          saved.push(sanitize(row));
        } else {
          const row = await repo.createSession(update);
          saved.push(sanitize(row));
        }
      }
      return saved;
    },

    // POST /mobile/navigation-sessions/cancel
    // Each item: { session_id, qr_id, cancelled_at? }
    async cancelSessions(input){
      const items = sessionArray(input);
      const saved = [];
      for(const item of items){
        const sessionId = nullableInteger(item.session_id || item.id, 'session_id');
        const update = {
          session_scope: normalizeSessionScope(item),
          qr_id: item.qr_id || item.qrId || null,
          status: 'canceled',
          success: false,
          visited_node_ids: normalizeVisitedNodeIds(item),
          client_created_at: item.cancelled_at || item.client_created_at || null
        };
        if(sessionId){
          const row = await repo.updateSession(sessionId, update);
          saved.push(sanitize(row));
        } else {
          const row = await repo.createSession(update);
          saved.push(sanitize(row));
        }
      }
      return saved;
    },

    // POST /mobile/sync  — bulk offline upload
    // Each item: { session_id (optional), qr_id, visited_node_ids, status, started_at, ended_at }
    async sync(input){
      const items = sessionArray(input);
      const saved = [];
      for(const item of items){
        const sessionId = nullableInteger(item.session_id || item.id, 'session_id');
        const statusRaw = String(item.status || 'completed').toLowerCase();
        const status = statusRaw.includes('start') ? 'started'
                     : statusRaw.includes('cancel') ? 'canceled'
                     : 'completed';
        const normalized = {
          session_scope: normalizeSessionScope(item),
          qr_id: item.qr_id || item.qrId || null,
          end_node: nullableInteger(
            item.destination_node_id || item.destinationNodeId || item.end_node, 'destination_node_id'
          ),
          status,
          success: status !== 'canceled',
          visited_node_ids: normalizeVisitedNodeIds(item),
          client_created_at: item.started_at || item.ended_at || item.client_created_at || null
        };
        if(sessionId){
          const row = await repo.updateSession(sessionId, normalized);
          if(row) saved.push(sanitize(row));
        } else {
          saved.push(sanitize(await repo.createSession(normalized)));
        }
      }
      return { accepted: saved.length, rejected: 0, sessions: saved, server_time: new Date().toISOString() };
    },

    // Legacy single-session save (kept for backward compat with POST /mobile/navigation-sessions)
    async saveSession(input){
      const items = sessionArray(input);
      const saved = [];
      for(const item of items){
        const sessionId = nullableInteger(item.session_id || item.id, 'session_id');
        const statusRaw = String(item.status || 'completed').toLowerCase();
        const status = statusRaw.includes('start') ? 'started'
                     : statusRaw.includes('cancel') ? 'canceled'
                     : 'completed';
        const normalized = {
          session_scope: normalizeSessionScope(item),
          qr_id: item.qr_id || item.qrId || null,
          end_node: nullableInteger(item.destination || item.destination_node_id || item.end_node, 'destination'),
          status,
          success: status !== 'canceled',
          visited_node_ids: normalizeVisitedNodeIds(item),
          client_created_at: item.timestamp || item.client_created_at || null
        };
        if(sessionId){
          const row = await repo.updateSession(sessionId, normalized);
          if(row) saved.push(sanitize(row));
        } else {
          saved.push(sanitize(await repo.createSession(normalized)));
        }
      }
      return saved.length === 1 ? saved[0] : saved;
    },

    async nearestNode(input){
      return repo.nearestNode(number(input.latitude,'latitude'), number(input.longitude,'longitude'));
    },

    listSessions: (filters = {}) => repo.listSessions(filters),
    listSyncs: () => repo.listSyncs(),

    createFeedback: input => repo.createFeedback({
      type: 'feedback',
      chips: Array.isArray(input.chips) ? input.chips.map(c => String(c)).filter(Boolean) : [],
      message: input.comment || input.message || null,
      rating: input.rating ? integer(Number(input.rating), 'rating') : null,
      session_id: input.session_id ? integer(Number(input.session_id), 'session_id') : null,
      node_id: null
    })
  };
}

module.exports = createMobileSyncService;
