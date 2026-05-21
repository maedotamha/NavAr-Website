const { integer, number, text } = require('../../domain/validators');
function normalizeSessionScope(input){
  const raw = input.session_scope || input.navigation_scope || input.scope || input.navigation_type || 'inside';
  const scope = String(raw).toLowerCase();
  return scope.includes('outside') ? 'outside' : 'inside';
}
function nullableInteger(value, field){
  if(value === undefined || value === null || value === '') return null;
  return integer(Number(value), field);
}
function normalizeStatus(input, fallback = 'completed'){
  const raw = String(input.status || input.event || fallback).toLowerCase();
  if(raw.includes('start')) return 'started';
  if(raw.includes('cancel') || raw.includes('fail')) return 'canceled';
  return 'completed';
}
function normalizeVisitedNodeIds(input){
  const raw = input.visited_node_ids || input.visitedNodeIds || [];
  return Array.isArray(raw) ? raw.map(item => String(item)).filter(Boolean) : [];
}
function normalizeSession(input){
  const status = normalizeStatus(input, input.success === false ? 'canceled' : 'completed');
  return {
    id: input.id ? integer(Number(input.id), 'id') : null,
    session_scope: normalizeSessionScope(input),
    qr_id: text(input.qr_id || input.qrId, 'qr_id', 120),
    start_node: nullableInteger(input.start_node, 'start_node'),
    end_node: nullableInteger(input.destination || input.destination_node_id || input.destinationNodeId || input.end_node, 'destination'),
    status,
    success: status !== 'canceled',
    visited_node_ids: normalizeVisitedNodeIds(input),
    client_created_at: input.timestamp || input.client_created_at || null
  };
}
function sessionArray(input){
  if(Array.isArray(input)) return input;
  if(Array.isArray(input.sessions)) return input.sessions;
  return [input];
}
function createMobileSyncService(repo){
  return {
    async bootstrap(){
      const [buildings, nodes, routes, markers] = await Promise.all([repo.listBuildings(), repo.listNodes(), repo.listRoutes(), repo.listMarkers()]);
      return { buildings, nodes, routes, markers, server_time: new Date().toISOString() };
    },
    async saveSession(input){
      const normalized = sessionArray(input).map(normalizeSession);
      const saved = [];
      for(const session of normalized){
        if(session.id){
          const updated = await repo.updateSession(session.id, session);
          if(updated) saved.push(updated);
        } else {
          saved.push(await repo.createSession(session));
        }
      }
      return saved.length === 1 ? saved[0] : saved;
    },
    async startSessions(input){
      const result = await this.saveSession(sessionArray(input).map(item => ({ ...item, status: 'started' })));
      return Array.isArray(result) ? result : [result];
    },
    async endSessions(input){
      const result = await this.saveSession(sessionArray(input).map(item => ({ ...item, status: 'completed' })));
      return Array.isArray(result) ? result : [result];
    },
    async cancelSessions(input){
      const result = await this.saveSession(sessionArray(input).map(item => ({ ...item, status: 'canceled' })));
      return Array.isArray(result) ? result : [result];
    },
    async sync(input){
      const sessions = sessionArray(input).map(normalizeSession);
      const savedSessions = [];
      for(const s of sessions){
        if(s.id){
          const updated = await repo.updateSession(s.id, s);
          if(updated) savedSessions.push(updated);
        } else {
          savedSessions.push(await repo.createSession(s));
        }
      }
      return { accepted: savedSessions.length, rejected: 0, sessions: savedSessions, server_time: new Date().toISOString() };
    },
    async nearestNode(input){
      return repo.nearestNode(number(input.latitude,'latitude'), number(input.longitude,'longitude'));
    },
    listSessions: (filters = {}) => repo.listSessions(filters),
    listSyncs: () => repo.listSyncs(),
    createFeedback: input => repo.createFeedback({
      type: 'feedback',
      chips: Array.isArray(input.chips) ? input.chips.map(chip => String(chip)).filter(Boolean) : [],
      message: text(input.comment || input.message, 'comment'),
      rating: input.rating ? integer(Number(input.rating), 'rating') : null,
      session_id: input.session_id ? integer(Number(input.session_id), 'session_id') : null,
      node_id: null
    })
  };
}
module.exports = createMobileSyncService;
