// ─── Core domain types for the Heatmap Analytics Dashboard ───────────────────
// Each type maps to a real transit-system concept:
//   Node      = physical location (room, gate, building)
//   Session   = one user's journey through multiple nodes
//   HeatPoint = aggregated canvas render unit (lat/lng + intensity)
//   Route     = frequent transition between two nodes

export type NodeType =
  | 'entrance'
  | 'classroom'
  | 'lab'
  | 'cafeteria'
  | 'library'
  | 'admin'
  | 'parking'
  | 'sports'
  | 'dormitory'
  | 'auditorium';

export type NodeStatus = 'active' | 'congested' | 'closed' | 'maintenance';

export interface Node {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  type: NodeType;
  status: NodeStatus;
  floor?: number;
  building?: string;
  capacity: number;
}

export interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  visitedNodes: string[];          // ordered list of node IDs
  routeTaken: [string, string][];  // [fromId, toId] edge pairs
  duration: number;                // seconds
  isActive: boolean;
}

// Computed from sessions — ready to render on canvas
export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;   // 0..1 normalised against max visits
  nodeId: string;
  visits: number;
  activeSessions: number;
  avgStaySeconds: number;
  peakHour: number;
}

export interface Route {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  trafficVolume: number;
  avgTimeSeconds: number;
  normalizedVolume: number;  // 0..1 for rendering width/color
}

export type TimeRange = '1h' | '6h' | '12h' | '24h' | '7d';

export interface FilterState {
  timeRange: TimeRange;
  nodeTypes: NodeType[];
  densityThreshold: number;    // 0..1 — hide points below this
  isLive: boolean;
  searchQuery: string;
  showRoutes: boolean;
  showClusters: boolean;
  selectedNodeId: string | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentHour: number;   // 0..23
  speed: 0.5 | 1 | 2 | 4;
  mode: 'live' | 'replay';
}

// ─── Analytics aggregations ────────────────────────────────────────────────

export interface TrafficDataPoint {
  time: string;
  sessions: number;
  activeNodes: number;
  avgDensity: number;
}

export interface HourlyData {
  hour: string;
  congestion: number;
  sessions: number;
  load: number;
}

export interface NodeRankEntry {
  node: Node;
  visits: number;
  avgStay: number;        // seconds
  peakHour: number;
  congestionPct: number;
}

export interface RouteUsageEntry {
  label: string;
  fromId: string;
  toId: string;
  count: number;
  avgTime: number;
}

export interface SessionGrowthEntry {
  date: string;
  sessions: number;
  growth: number;    // % vs previous period
}

export interface AnalyticsSummary {
  activeSessions: number;
  hottestNode: Node | null;
  congestedRouteCount: number;
  avgTravelTimeSeconds: number;
  peakHour: number;
  systemLoadPct: number;
  trend: 'up' | 'down' | 'stable';
}
