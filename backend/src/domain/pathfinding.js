function buildGraph(routes){
  const graph = new Map();
  for(const route of routes){
    const start = Number(route.start_node);
    const end = Number(route.end_node);
    const distance = Number(route.distance || 0);
    if(!graph.has(start)) graph.set(start, []);
    if(!graph.has(end)) graph.set(end, []);
    graph.get(start).push({ node:end, distance, routeId:route.id });
    graph.get(end).push({ node:start, distance, routeId:route.id });
  }
  return graph;
}
function shortestPath(routes, startNode, endNode){
  const start = Number(startNode);
  const end = Number(endNode);
  const graph = buildGraph(routes);
  const distances = new Map([[start, 0]]);
  const previous = new Map();
  const unvisited = new Set(graph.keys());
  while(unvisited.size){
    let current = null;
    let best = Infinity;
    for(const node of unvisited){
      const score = distances.get(node) ?? Infinity;
      if(score < best){ best = score; current = node; }
    }
    if(current === null || best === Infinity) break;
    if(current === end) break;
    unvisited.delete(current);
    for(const edge of graph.get(current) || []){
      if(!unvisited.has(edge.node)) continue;
      const candidate = best + edge.distance;
      if(candidate < (distances.get(edge.node) ?? Infinity)){
        distances.set(edge.node, candidate);
        previous.set(edge.node, { node:current, routeId:edge.routeId });
      }
    }
  }
  if(start !== end && !previous.has(end)) return null;
  const nodes = [end];
  const routeIds = [];
  let cursor = end;
  while(cursor !== start){
    const step = previous.get(cursor);
    if(!step) break;
    routeIds.unshift(step.routeId);
    cursor = step.node;
    nodes.unshift(cursor);
  }
  return { nodes, routeIds, distance: distances.get(end) || 0 };
}
module.exports = { shortestPath };