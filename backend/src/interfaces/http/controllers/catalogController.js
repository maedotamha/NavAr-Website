const asyncHandler = require('../asyncHandler');
function createCatalogController(service){
  return {
    listBuildings: asyncHandler(async (_req,res)=>res.json({ buildings: await service.listBuildings() })),
    createBuilding: asyncHandler(async (req,res)=>res.status(201).json({ building: await service.createBuilding(req.body) })),
    updateBuildingStatus: asyncHandler(async (req,res)=>res.json({ building: await service.updateBuildingStatus(req.params.id, req.body) })),
    listNodes: asyncHandler(async (_req,res)=>res.json({ nodes: await service.listNodes() })),
    listPois: asyncHandler(async (_req,res)=>res.json({ pois: await service.listPois() })),
    createNode: asyncHandler(async (req,res)=>res.status(201).json({ node: await service.createNode(req.body) })),
    listRoutes: asyncHandler(async (_req,res)=>res.json({ routes: await service.listRoutes() })),
    createRoute: asyncHandler(async (req,res)=>res.status(201).json({ route: await service.createRoute(req.body) })),
    listMarkers: asyncHandler(async (_req,res)=>res.json({ markers: await service.listMarkers() })),
    createMarker: asyncHandler(async (req,res)=>res.status(201).json({ marker: await service.createMarker(req.body) })),
    listQrScans: asyncHandler(async (_req,res)=>res.json({ scans: await service.listQrScans() })),
    listPoiCategories: asyncHandler(async (_req,res)=>res.json({ categories: await service.listPoiCategories() })),
    createPoiCategory: asyncHandler(async (req,res)=>res.status(201).json({ category: await service.createPoiCategory(req.body) })),
    patchPoiVisibility: asyncHandler(async (req,res)=>res.json({ node: await service.patchPoiVisibility(req.params.id, req.body) })),
    getAccessibilityOverview: asyncHandler(async (_req,res)=>res.json({ accessibility: await service.getAccessibilityOverview() }))
  };
}
module.exports = createCatalogController;
