const { integer, number, text } = require('../../domain/validators');
const { getFloorNodes, getFloorPois } = require('./floorDataService');
function createCatalogService(repo){
  return {
    listBuildings: () => repo.listBuildings(),
    createBuilding: input => repo.createBuilding({ name:text(input.name,'name'), description:String(input.description || ''), longitude:number(input.longitude,'longitude'), latitude:number(input.latitude,'latitude') }),
    updateBuildingStatus: (id, input) => repo.updateBuildingStatus(integer(Number(id), 'id'), String(input.status || '').toLowerCase() === 'inactive' ? 'inactive' : 'active'),
    async listNodes(){
      const nodes = await repo.listNodes();
      return [...nodes, ...getFloorNodes()];
    },
    async listPois(){
      return getFloorPois();
    },
    createNode: input => repo.createNode({ 
      node_name:text(input.node_name,'node_name'), 
      longitude:number(input.longitude,'longitude'), 
      latitude:number(input.latitude,'latitude'),
      floor_label: input.floor_label ? String(input.floor_label) : 'Ground',
      node_type: input.node_type ? String(input.node_type) : 'corridor',
      is_published: input.is_published !== false,
      is_staff_only: input.is_staff_only === true
    }),
    listRoutes: () => repo.listRoutes(),
    createRoute: input => repo.createRoute({ 
      start_node:integer(Number(input.start_node),'start_node'), 
      end_node:integer(Number(input.end_node),'end_node'), 
      distance:number(input.distance,'distance'),
      is_accessible: input.is_accessible !== false
    }),
    listMarkers: () => repo.listMarkers(),
    createMarker: input => repo.createMarker({ 
      marker_name:text(input.marker_name,'marker_name'), 
      model_path:String(input.model_path || ''), 
      longitude:number(input.longitude,'longitude'), 
      latitude:number(input.latitude,'latitude'),
      linked_node: input.linked_node ? integer(Number(input.linked_node), 'linked_node') : null,
      status: input.status ? String(input.status) : 'active'
    }),
    listQrScans: () => repo.listQrScans(),
    listPoiCategories: () => repo.listPoiCategories(),
    createPoiCategory: input => repo.createPoiCategory({
      name: text(input.name, 'name'),
      key: text(input.key, 'key'),
      description: String(input.description || ''),
      is_published: input.is_published !== false
    }),
    patchPoiVisibility: (id, input) => repo.patchPoiVisibility(integer(Number(id), 'id'), {
      is_published: input.is_published !== undefined ? !!input.is_published : undefined,
      is_staff_only: input.is_staff_only !== undefined ? !!input.is_staff_only : undefined
    }),
    getAccessibilityOverview: () => repo.getAccessibilityOverview()
  };
}
module.exports = createCatalogService;
