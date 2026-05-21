const asyncHandler = require('../asyncHandler');

function createSidebarController(service) {
  return {
    getSidebar: asyncHandler(async (req, res) => res.json(await service.getSidebar(req.auth)))
  };
}

module.exports = createSidebarController;
