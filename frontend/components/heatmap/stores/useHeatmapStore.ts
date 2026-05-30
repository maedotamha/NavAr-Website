'use client';
// ─── Global state for the heatmap dashboard (Zustand) ─────────────────────────
//
// Split into logical slices:
//   session slice  – raw + filtered sessions
//   heatmap slice  – computed heat points + routes
//   filter slice   – user-controlled filter state
//   analytics slice– aggregated chart data
//   playback slice – time replay state

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Node, Session, HeatPoint, Route, FilterState, PlaybackState,
  AnalyticsSummary, TrafficDataPoint, HourlyData, NodeRankEntry,
  RouteUsageEntry, SessionGrowthEntry, TimeRange,
} from '../lib/types';
import { CAMPUS_NODES, BASE_SESSIONS, generateLiveSessions } from '../lib/mockData';
import { normaliseIntensities } from '../lib/heatmapUtils';

// ─── helpers ──────────────────────────────────────────────────────────────────

function filterByTimeRange(sessions: Session[], range: TimeRange): Session[] {
  const now = Date.now();
  const ms: Record<TimeRange, number> = {
    '1h': 3_600_000,
    '6h': 21_600_000,
    '12h': 43_200_000,
    '24h': 86_400_000,
    '7d': 604_800_000,
  };
  const cutoff = now - ms[range];
  return sessions.filter(s => s.startedAt.getTime() >= cutoff);
}

function computeHeatPoints(sessions: Session[], nodes: Node[]): HeatPoint[] {
  const visits: Record<string, number> = {};
  const totalStay: Record<string, number> = {};
  const stayCount: Record<string, number> = {};
  const activeCounts: Record<string, number> = {};
  const peakHourCounts: Record<string, number[]> = {};

  for (const s of sessions) {
    for (const nid of s.visitedNodes) {
      visits[nid] = (visits[nid] || 0) + 1;
      totalStay[nid] = (totalStay[nid] || 0) + (s.duration / s.visitedNodes.length);
      stayCount[nid] = (stayCount[nid] || 0) + 1;
      if (s.isActive) activeCounts[nid] = (activeCounts[nid] || 0) + 1;

      const h = s.startedAt.getHours();
      if (!peakHourCounts[nid]) peakHourCounts[nid] = new Array(24).fill(0);
      peakHourCounts[nid][h]++;
    }
  }

  const normed = normaliseIntensities(visits);

  return nodes
    .filter(n => visits[n.id] !== undefined)
    .map(n => {
      const hourArr = peakHourCounts[n.id] || new Array(24).fill(0);
      const peakHour = hourArr.indexOf(Math.max(...hourArr));
      return {
        lat: n.latitude,
        lng: n.longitude,
        intensity: normed[n.id] ?? 0,
        nodeId: n.id,
        visits: visits[n.id] || 0,
        activeSessions: activeCounts[n.id] || 0,
        avgStaySeconds: stayCount[n.id] ? totalStay[n.id] / stayCount[n.id] : 0,
        peakHour,
      };
    });
}

function computeRoutes(sessions: Session[]): Route[] {
  const edgeCounts: Record<string, number> = {};
  const edgeTimes: Record<string, number[]> = {};

  for (const s of sessions) {
    for (const [from, to] of s.routeTaken) {
      const key = `${from}→${to}`;
      edgeCounts[key] = (edgeCounts[key] || 0) + 1;
      if (!edgeTimes[key]) edgeTimes[key] = [];
      edgeTimes[key].push(s.duration / Math.max(1, s.routeTaken.length));
    }
  }

  const maxVol = Math.max(...Object.values(edgeCounts), 1);
  return Object.entries(edgeCounts).map(([key, count]) => {
    const [from, to] = key.split('→');
    const times = edgeTimes[key] || [0];
    return {
      id: key,
      fromNodeId: from,
      toNodeId: to,
      trafficVolume: count,
      avgTimeSeconds: times.reduce((a, b) => a + b, 0) / times.length,
      normalizedVolume: count / maxVol,
    };
  });
}

function computeAnalyticsSummary(
  sessions: Session[],
  heatPoints: HeatPoint[],
  routes: Route[],
  nodes: Node[],
): AnalyticsSummary {
  const activeSessions = sessions.filter(s => s.isActive).length;
  const hottestPoint = heatPoints.reduce((a, b) => a.visits > b.visits ? a : b, heatPoints[0]);
  const hottestNode = hottestPoint ? nodes.find(n => n.id === hottestPoint.nodeId) ?? null : null;
  const congestedRouteCount = routes.filter(r => r.normalizedVolume > 0.6).length;
  const durations = sessions.map(s => s.duration).filter(Boolean);
  const avgTravelTimeSeconds = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const hourCounts = new Array(24).fill(0);
  sessions.forEach(s => hourCounts[s.startedAt.getHours()]++);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const systemLoadPct = Math.min(100, Math.round(
    (heatPoints.reduce((a, b) => a + b.intensity, 0) / Math.max(heatPoints.length, 1)) * 100
  ));

  return {
    activeSessions,
    hottestNode,
    congestedRouteCount,
    avgTravelTimeSeconds,
    peakHour,
    systemLoadPct,
    trend: activeSessions > 15 ? 'up' : activeSessions > 5 ? 'stable' : 'down',
  };
}

function computeTrafficOverTime(sessions: Session[]): TrafficDataPoint[] {
  const buckets: Record<string, { sessions: Set<string>; nodes: Set<string> }> = {};

  for (const s of sessions) {
    const h = s.startedAt.getHours();
    const key = `${String(h).padStart(2, '0')}:00`;
    if (!buckets[key]) buckets[key] = { sessions: new Set(), nodes: new Set() };
    buckets[key].sessions.add(s.id);
    s.visitedNodes.forEach(n => buckets[key].nodes.add(n));
  }

  return Array.from({ length: 24 }, (_, h) => {
    const key = `${String(h).padStart(2, '0')}:00`;
    const b = buckets[key] || { sessions: new Set(), nodes: new Set() };
    return {
      time: key,
      sessions: b.sessions.size,
      activeNodes: b.nodes.size,
      avgDensity: b.nodes.size > 0 ? b.sessions.size / b.nodes.size : 0,
    };
  });
}

function computeHourlyData(sessions: Session[]): HourlyData[] {
  return Array.from({ length: 24 }, (_, h) => {
    const hour = `${String(h).padStart(2, '0')}:00`;
    const hourSessions = sessions.filter(s => s.startedAt.getHours() === h);
    const congestion = Math.min(100, Math.round(hourSessions.length * 2.5));
    return {
      hour,
      congestion,
      sessions: hourSessions.length,
      load: Math.min(100, congestion + Math.floor(Math.random() * 10)),
    };
  });
}

function computeNodeRanking(sessions: Session[], nodes: Node[]): NodeRankEntry[] {
  const visits: Record<string, number> = {};
  const totalStay: Record<string, number> = {};
  const stayCount: Record<string, number> = {};
  const hourArr: Record<string, number[]> = {};

  for (const s of sessions) {
    for (const nid of s.visitedNodes) {
      visits[nid] = (visits[nid] || 0) + 1;
      totalStay[nid] = (totalStay[nid] || 0) + (s.duration / s.visitedNodes.length);
      stayCount[nid] = (stayCount[nid] || 0) + 1;
      const h = s.startedAt.getHours();
      if (!hourArr[nid]) hourArr[nid] = new Array(24).fill(0);
      hourArr[nid][h]++;
    }
  }

  return nodes
    .filter(n => visits[n.id])
    .map(n => {
      const ha = hourArr[n.id] || new Array(24).fill(0);
      return {
        node: n,
        visits: visits[n.id] || 0,
        avgStay: stayCount[n.id] ? totalStay[n.id] / stayCount[n.id] : 0,
        peakHour: ha.indexOf(Math.max(...ha)),
        congestionPct: Math.min(100, Math.round(((visits[n.id] || 0) / n.capacity) * 100)),
      };
    })
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 12);
}

function computeRouteUsage(sessions: Session[], nodes: Node[]): RouteUsageEntry[] {
  const counts: Record<string, { count: number; times: number[] }> = {};
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  for (const s of sessions) {
    for (const [from, to] of s.routeTaken) {
      const key = `${from}→${to}`;
      if (!counts[key]) counts[key] = { count: 0, times: [] };
      counts[key].count++;
      counts[key].times.push(s.duration / Math.max(1, s.routeTaken.length));
    }
  }

  return Object.entries(counts)
    .map(([key, { count, times }]) => {
      const [from, to] = key.split('→');
      const fromNode = nodeMap[from];
      const toNode = nodeMap[to];
      return {
        label: `${fromNode?.shortName ?? from} → ${toNode?.shortName ?? to}`,
        fromId: from,
        toId: to,
        count,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function computeSessionGrowth(sessions: Session[]): SessionGrowthEntry[] {
  const dailyCounts: Record<string, number> = {};

  for (const s of sessions) {
    const d = s.startedAt.toISOString().slice(0, 10);
    dailyCounts[d] = (dailyCounts[d] || 0) + 1;
  }

  const entries = Object.entries(dailyCounts).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([date, sessions], i) => {
    const prev = i > 0 ? entries[i - 1][1] : sessions;
    const growth = prev > 0 ? Math.round(((sessions - prev) / prev) * 100) : 0;
    return { date: date.slice(5), sessions, growth };
  });
}

// ─── Store definition ──────────────────────────────────────────────────────────

interface HeatmapStore {
  // ── data
  nodes: Node[];
  allSessions: Session[];
  filteredSessions: Session[];
  heatPoints: HeatPoint[];
  routes: Route[];

  // ── analytics
  summary: AnalyticsSummary;
  trafficOverTime: TrafficDataPoint[];
  hourlyData: HourlyData[];
  nodeRanking: NodeRankEntry[];
  routeUsage: RouteUsageEntry[];
  sessionGrowth: SessionGrowthEntry[];

  // ── ui state
  filters: FilterState;
  playback: PlaybackState;
  isLoading: boolean;
  sidebarOpen: boolean;
  analyticsOpen: boolean;
  mobileSheetOpen: boolean;

  // ── actions
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setSearchQuery: (q: string) => void;
  toggleLive: () => void;
  setPlayback: (p: Partial<PlaybackState>) => void;
  addLiveSessions: (sessions: Session[]) => void;
  recompute: () => void;
  toggleSidebar: () => void;
  toggleAnalytics: () => void;
  toggleMobileSheet: () => void;
}

const initialFilters: FilterState = {
  timeRange: '24h',
  nodeTypes: [],
  densityThreshold: 0,
  isLive: true,
  searchQuery: '',
  showRoutes: true,
  showClusters: true,
  selectedNodeId: null,
};

const emptyAnalytics: AnalyticsSummary = {
  activeSessions: 0,
  hottestNode: null,
  congestedRouteCount: 0,
  avgTravelTimeSeconds: 0,
  peakHour: 8,
  systemLoadPct: 0,
  trend: 'stable',
};

function deriveState(allSessions: Session[], filters: FilterState, nodes: Node[]) {
  let filtered = filterByTimeRange(allSessions, filters.timeRange);

  if (filters.nodeTypes.length > 0) {
    const allowedIds = new Set(nodes.filter(n => filters.nodeTypes.includes(n.type)).map(n => n.id));
    filtered = filtered.filter(s => s.visitedNodes.some(nid => allowedIds.has(nid)));
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    const matchingIds = new Set(nodes.filter(n =>
      n.name.toLowerCase().includes(q) || n.shortName.toLowerCase().includes(q)
    ).map(n => n.id));
    filtered = filtered.filter(s => s.visitedNodes.some(nid => matchingIds.has(nid)));
  }

  const heatPoints = computeHeatPoints(filtered, nodes)
    .filter(hp => hp.intensity >= filters.densityThreshold);

  const routes = computeRoutes(filtered)
    .sort((a, b) => b.normalizedVolume - a.normalizedVolume)
    .slice(0, 60);

  const summary = computeAnalyticsSummary(filtered, heatPoints, routes, nodes);
  const trafficOverTime = computeTrafficOverTime(filtered);
  const hourlyData = computeHourlyData(filtered);
  const nodeRanking = computeNodeRanking(filtered, nodes);
  const routeUsage = computeRouteUsage(filtered, nodes);
  const sessionGrowth = computeSessionGrowth(allSessions);

  return { filteredSessions: filtered, heatPoints, routes, summary, trafficOverTime, hourlyData, nodeRanking, routeUsage, sessionGrowth };
}

export const useHeatmapStore = create<HeatmapStore>()(
  immer((set, get) => {
    const initial = deriveState(BASE_SESSIONS, initialFilters, CAMPUS_NODES);
    return {
      nodes: CAMPUS_NODES,
      allSessions: BASE_SESSIONS,
      ...initial,
      summary: computeAnalyticsSummary(initial.filteredSessions, initial.heatPoints, initial.routes, CAMPUS_NODES),
      filters: initialFilters,
      playback: { isPlaying: false, currentHour: new Date().getHours(), speed: 1, mode: 'live' },
      isLoading: false,
      sidebarOpen: true,
      analyticsOpen: true,
      mobileSheetOpen: false,

      setFilter: (key, value) => {
        set(state => { state.filters[key] = value as never; });
        get().recompute();
      },

      setSearchQuery: (q) => {
        set(state => { state.filters.searchQuery = q; });
        get().recompute();
      },

      toggleLive: () => {
        set(state => { state.filters.isLive = !state.filters.isLive; });
      },

      setPlayback: (p) => {
        set(state => { Object.assign(state.playback, p); });
      },

      addLiveSessions: (sessions) => {
        set(state => {
          state.allSessions = [...state.allSessions, ...sessions].slice(-3000);
        });
        get().recompute();
      },

      recompute: () => {
        const { allSessions, filters, nodes } = get();
        const derived = deriveState(allSessions, filters, nodes);
        set(state => { Object.assign(state, derived); });
      },

      toggleSidebar: () => set(state => { state.sidebarOpen = !state.sidebarOpen; }),
      toggleAnalytics: () => set(state => { state.analyticsOpen = !state.analyticsOpen; }),
      toggleMobileSheet: () => set(state => { state.mobileSheetOpen = !state.mobileSheetOpen; }),
    };
  }),
);
