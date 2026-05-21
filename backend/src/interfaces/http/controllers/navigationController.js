const asyncHandler = require('../asyncHandler');
function createNavigationController(service){
  return {
    findPath: asyncHandler(async (req,res)=>res.json({ route: await service.findPath(req.query) })),
    nearestNode: asyncHandler(async (req,res)=>res.json({ node: await service.nearestNode(req.query) }))
  };
}
module.exports = createNavigationController;