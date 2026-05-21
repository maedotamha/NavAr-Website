const AppError = require('../../domain/AppError');
const { integer, number } = require('../../domain/validators');
const { shortestPath } = require('../../domain/pathfinding');
function createNavigationService(repo){
  return {
    async findPath(input){
      const startNode = integer(Number(input.startNode || input.start_node),'startNode');
      const endNode = integer(Number(input.endNode || input.end_node),'endNode');
      const routes = await repo.listRoutes();
      const result = shortestPath(routes, startNode, endNode);
      if(!result) throw new AppError('No route found between the requested nodes', 404);
      const nodes = await repo.listNodes();
      const nodeMap = new Map(nodes.map(node => [Number(node.id), node]));
      return { ...result, path: result.nodes.map(id => nodeMap.get(Number(id))).filter(Boolean) };
    },
    async nearestNode(input){
      return repo.nearestNode(number(input.latitude,'latitude'), number(input.longitude,'longitude'));
    }
  };
}
module.exports = createNavigationService;