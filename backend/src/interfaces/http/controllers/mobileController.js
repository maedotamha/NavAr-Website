const asyncHandler = require('../asyncHandler');
function createMobileController(service){
  return {
    bootstrap: asyncHandler(async (_req,res)=>res.json(await service.bootstrap())),
    saveSession: asyncHandler(async (req,res)=>res.status(201).json({ session: await service.saveSession(req.body) })),
    startSessions: asyncHandler(async (req,res)=>res.status(201).json({ sessions: await service.startSessions(req.body) })),
    endSessions: asyncHandler(async (req,res)=>res.status(201).json({ sessions: await service.endSessions(req.body) })),
    cancelSessions: asyncHandler(async (req,res)=>res.status(201).json({ sessions: await service.cancelSessions(req.body) })),
    sync: asyncHandler(async (req,res)=>res.json(await service.sync(req.body))),
    nearestNode: asyncHandler(async (req,res)=>res.json({ node: await service.nearestNode(req.query) })),
    listSessions: asyncHandler(async (req,res)=>res.json({ sessions: await service.listSessions({ status: req.query.status, scope: req.query.scope }) })),
    listSyncs: asyncHandler(async (_req,res)=>res.json({ syncs: await service.listSyncs() })),
    createFeedback: asyncHandler(async (req,res)=>res.status(201).json({ feedback: await service.createFeedback(req.body) }))
  };
}
module.exports = createMobileController;
