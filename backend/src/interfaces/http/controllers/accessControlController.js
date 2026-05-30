const asyncHandler = require('../asyncHandler');

function createAccessControlController(service) {
  return {
    overview: asyncHandler(async (_req, res) => res.json(await service.getOverview())),
    createRole: asyncHandler(async (req, res) => res.status(201).json(await service.createRole(req.body))),
    updateRole: asyncHandler(async (req, res) => res.json(await service.updateRole(req.params.id, req.body))),
    deleteRole: asyncHandler(async (req, res) => res.json(await service.deleteRole(req.params.id))),
    assignUserRole: asyncHandler(async (req, res) => res.json(await service.assignUserRole(req.params.id, req.body.roleId))),
    createUser: asyncHandler(async (req, res) => res.status(201).json(await service.createUser(req.body))),
    updateUser: asyncHandler(async (req, res) => res.json(await service.updateUser(req.params.id, req.body))),
    deleteUser: asyncHandler(async (req, res) => res.json(await service.deleteUser(req.params.id, req.auth))),
    createModule: asyncHandler(async (req, res) => res.status(201).json(await service.createModule(req.body))),
    updateModule: asyncHandler(async (req, res) => res.json(await service.updateModule(req.params.id, req.body))),
    deleteModule: asyncHandler(async (req, res) => res.json(await service.deleteModule(req.params.id))),
    listAccessLogs: asyncHandler(async (_req, res) => res.json({ logs: await service.listAccessLogs() })),
    createAccessLog: asyncHandler(async (req, res) => res.status(201).json({
      log: await service.createAccessLog(
        req.auth?.email || `admin:${req.auth?.sub}`,
        req.body.action || 'Visited Page',
        req.body.target || 'Dashboard',
        req.auth?.role || null
      )
    }))
  };
}

module.exports = createAccessControlController;
