const asyncHandler = require('../asyncHandler');
function createDashboardController(service){
  return { 
    getDashboard: asyncHandler(async (_req,res)=>res.json(await service.getDashboard())),
    listFeedback: asyncHandler(async (req,res)=>res.json({ feedback: await service.listFeedback(req.query.type) })),
    listRatings: asyncHandler(async (_req,res)=>res.json({ feedback: await service.listFeedback('rating') })),
    updateFeedbackStatus: asyncHandler(async (req,res)=>res.json({ feedback: await service.updateFeedbackStatus(req.params.id, req.body.status) })),
    getSettings: asyncHandler(async (_req,res)=>res.json({ settings: await service.getSettings() })),
    getSettingsByCategory: asyncHandler(async (req,res)=>res.json({ settings: await service.getSettingsByCategory(req.params.category) })),
    updateSettingsByCategory: asyncHandler(async (req,res)=>res.json({ settings: await service.updateSettingsByCategory(req.params.category, req.body) }))
  };
}
module.exports = createDashboardController;