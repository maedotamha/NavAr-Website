const asyncHandler = require('../asyncHandler');

function logSessionRequest(action, req, result){
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const keys = Array.isArray(body) ? ['array'] : Object.keys(body);
  console.info('[mobile-session:accepted]', {
    action,
    path: req.originalUrl,
    body_keys: keys,
    saved_count: Array.isArray(result) ? result.length : 1,
    session_ids: (Array.isArray(result) ? result : [result]).map(item => item?.session_id || null)
  });
}

function createMobileController(service){
  return {
    bootstrap: asyncHandler(async (_req,res)=>res.json(await service.bootstrap())),
    saveSession: asyncHandler(async (req,res)=>res.status(201).json({ session: await service.saveSession(req.body) })),
    startSessions: asyncHandler(async (req,res)=>{
      const sessions = await service.startSessions(req.body);
      logSessionRequest('start', req, sessions);
      res.status(201).json({ sessions });
    }),
    endSessions: asyncHandler(async (req,res)=>{
      const sessions = await service.endSessions(req.body);
      logSessionRequest('end', req, sessions);
      res.status(201).json({ sessions });
    }),
    cancelSessions: asyncHandler(async (req,res)=>{
      const sessions = await service.cancelSessions(req.body);
      logSessionRequest('cancel', req, sessions);
      res.status(201).json({ sessions });
    }),
    sync: asyncHandler(async (req,res)=>res.json(await service.sync(req.body))),
    nearestNode: asyncHandler(async (req,res)=>res.json({ node: await service.nearestNode(req.query) })),
    listSessions: asyncHandler(async (req,res)=>res.json({ sessions: await service.listSessions({ status: req.query.status, scope: req.query.scope }) })),
    listSyncs: asyncHandler(async (_req,res)=>res.json({ syncs: await service.listSyncs() })),
    createFeedback: asyncHandler(async (req,res)=>res.status(201).json({ feedback: await service.createFeedback(req.body) }))
  };
}
module.exports = createMobileController;
