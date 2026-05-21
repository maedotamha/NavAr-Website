const asyncHandler = require('../asyncHandler');
function createAuthController(service){
  return {
    login: asyncHandler(async (req,res)=>res.json(await service.login(req.body))),
    me: asyncHandler(async (req,res)=>res.json({ admin: await service.getCurrentUser(req.auth) }))
  };
}
module.exports = createAuthController;