'use client';
import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';
import { paintHeatmap, heatRadius } from './lib/heatmapUtils';
import type { HeatPoint, Route, Node } from './lib/types';

// ─── Leaflet icon fix (default markers broken in webpack) ─────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const AASTU_CENTER: [number, number] = [8.8848, 38.8080];

// ─── Node type colors ──────────────────────────────────────────────────────────
const NODE_TYPE_COLOR: Record<string, string> = {
  entrance: '#06b6d4', classroom: '#3b82f6', lab: '#8b5cf6',
  cafeteria: '#f59e0b', library: '#10b981', admin: '#64748b',
  parking: '#475569', sports: '#22c55e', dormitory: '#ec4899', auditorium: '#f97316',
};

// ─── Canvas Heatmap Layer ──────────────────────────────────────────────────────
function HeatmapLayer({ heatPoints }: { heatPoints: HeatPoint[] }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<L.Layer | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatPoints.length) return;

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size.x, size.y);

    const zoom = map.getZoom();
    const radius = heatRadius(zoom, 35);

    const points = heatPoints.map(hp => {
      const px = map.latLngToContainerPoint([hp.lat, hp.lng]);
      return { x: px.x, y: px.y, intensity: hp.intensity, radius };
    });

    paintHeatmap(ctx, points, 1);
  }, [map, heatPoints]);

  useEffect(() => {
    if (!map) return;

    // Create canvas overlay
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:400;';
    canvasRef.current = canvas;

    // Custom Leaflet layer
    const CanvasOverlay = L.Layer.extend({
      onAdd(m: L.Map) {
        const pane = m.getPane('overlayPane')!;
        pane.appendChild(canvas);
        m.on('moveend zoomend resize', redraw);
        redraw();
        return this;
      },
      onRemove(m: L.Map) {
        m.off('moveend zoomend resize', redraw);
        canvas.remove();
      },
    });

    const overlay = new (CanvasOverlay as any)();
    layerRef.current = overlay;
    overlay.addTo(map);

    return () => {
      overlay.remove();
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    redraw();
  }, [redraw]);

  return null;
}

// ─── Route Lines Layer ─────────────────────────────────────────────────────────
function RoutesLayer({ routes, nodes, visible }: { routes: Route[]; nodes: Node[]; visible: boolean }) {
  const map = useMap();
  const linesRef = useRef<L.Polyline[]>([]);
  const nodeMap = useRef<Record<string, Node>>({});

  useEffect(() => {
    nodeMap.current = Object.fromEntries(nodes.map(n => [n.id, n]));
  }, [nodes]);

  useEffect(() => {
    // Remove old lines
    linesRef.current.forEach(l => l.remove());
    linesRef.current = [];

    if (!visible) return;

    routes.slice(0, 40).forEach(route => {
      const fromNode = nodeMap.current[route.fromNodeId];
      const toNode = nodeMap.current[route.toNodeId];
      if (!fromNode || !toNode) return;

      const opacity = 0.2 + route.normalizedVolume * 0.6;
      const weight = 1.5 + route.normalizedVolume * 4;

      // Color by volume: low=blue, high=red
      const r = Math.round(route.normalizedVolume * 200);
      const g = Math.round((1 - route.normalizedVolume) * 80 + 40);
      const b = Math.round((1 - route.normalizedVolume) * 200 + 55);
      const color = `rgb(${r},${g},${b})`;

      const line = L.polyline(
        [[fromNode.latitude, fromNode.longitude], [toNode.latitude, toNode.longitude]],
        { color, weight, opacity, dashArray: route.normalizedVolume < 0.3 ? '4 6' : undefined }
      );

      line.bindTooltip(
        `<div style="font-size:12px;color:#f0f4ff;background:#0d1117;border:1px solid rgba(255,255,255,0.1);padding:6px 10px;border-radius:6px;">
          <b>${fromNode.shortName} → ${toNode.shortName}</b><br/>
          <span style="color:#94a3b8">Traffic: ${route.trafficVolume} sessions</span>
        </div>`,
        { sticky: true, className: 'heatmap-tooltip', opacity: 1 }
      );

      line.addTo(map);
      linesRef.current.push(line);
    });

    return () => {
      linesRef.current.forEach(l => l.remove());
      linesRef.current = [];
    };
  }, [routes, visible, map]);

  return null;
}

// ─── Node Markers Layer ────────────────────────────────────────────────────────
function NodeMarkersLayer({
  nodes, heatPoints, selectedNodeId, onSelectNode,
}: {
  nodes: Node[];
  heatPoints: HeatPoint[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const map = useMap();
  const markersRef = useRef<L.CircleMarker[]>([]);
  const hpMap = useRef<Record<string, HeatPoint>>({});

  useEffect(() => {
    hpMap.current = Object.fromEntries(heatPoints.map(hp => [hp.nodeId, hp]));
  }, [heatPoints]);

  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    nodes.forEach(node => {
      const hp = hpMap.current[node.id];
      if (!hp && selectedNodeId !== node.id) return; // skip nodes with no traffic unless selected

      const color = NODE_TYPE_COLOR[node.type] || '#3b82f6';
      const isSelected = selectedNodeId === node.id;
      const radius = hp ? 5 + hp.intensity * 9 : 5;

      const marker = L.circleMarker([node.latitude, node.longitude], {
        radius: isSelected ? radius + 3 : radius,
        fillColor: color,
        fillOpacity: isSelected ? 1 : 0.75,
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 2.5 : 1,
      });

      const avgMins = hp ? Math.floor(hp.avgStaySeconds / 60) : 0;
      const avgSecs = hp ? Math.round(hp.avgStaySeconds % 60) : 0;

      marker.bindTooltip(
        `<div style="font-size:12px;color:#f0f4ff;background:#0d1117;border:1px solid rgba(255,255,255,0.12);padding:8px 12px;border-radius:8px;min-width:150px;">
          <b style="color:${color}">${node.name}</b><br/>
          <span style="color:#64748b;font-size:10px;text-transform:uppercase">${node.type}</span><br/>
          ${hp ? `
            <div style="margin-top:4px;font-size:11px;">
              <span style="color:#94a3b8">Visits: </span><span style="color:#f0f4ff">${hp.visits}</span><br/>
              <span style="color:#94a3b8">Active: </span><span style="color:#22c55e">${hp.activeSessions}</span><br/>
              <span style="color:#94a3b8">Avg stay: </span><span style="color:#f0f4ff">${avgMins > 0 ? avgMins + 'm ' : ''}${avgSecs}s</span><br/>
              <span style="color:#94a3b8">Peak: </span><span style="color:#f59e0b">${hp.peakHour}:00</span>
            </div>
          ` : ''}
        </div>`,
        { sticky: false, className: 'heatmap-tooltip', opacity: 1 }
      );

      marker.on('click', () => {
        onSelectNode(selectedNodeId === node.id ? null : node.id);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [nodes, heatPoints, selectedNodeId, onSelectNode, map]);

  return null;
}

// ─── Cluster Circles Layer ─────────────────────────────────────────────────────
function ClustersLayer({ heatPoints, nodes, visible }: { heatPoints: HeatPoint[]; nodes: Node[]; visible: boolean }) {
  const map = useMap();
  const circlesRef = useRef<L.Circle[]>([]);
  const nodeMap = useRef<Record<string, Node>>({});

  useEffect(() => {
    nodeMap.current = Object.fromEntries(nodes.map(n => [n.id, n]));
  }, [nodes]);

  useEffect(() => {
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];
    if (!visible) return;

    const hot = heatPoints.filter(hp => hp.intensity > 0.6);
    hot.forEach(hp => {
      const node = nodeMap.current[hp.nodeId];
      if (!node) return;

      const circle = L.circle([hp.lat, hp.lng], {
        radius: 40 + hp.intensity * 80,
        fillColor: '#ef4444',
        fillOpacity: 0.06 + hp.intensity * 0.08,
        color: '#ef4444',
        weight: 1,
        opacity: 0.3 + hp.intensity * 0.3,
        dashArray: '6 6',
      });

      circle.addTo(map);
      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach(c => c.remove());
      circlesRef.current = [];
    };
  }, [heatPoints, visible, map]);

  return null;
}

// ─── Map event sync ────────────────────────────────────────────────────────────
function MapEventHandler() {
  useMapEvents({
    click: () => {
      useHeatmapStore.getState().setFilter('selectedNodeId', null);
    },
  });
  return null;
}

// ─── Legend ────────────────────────────────────────────────────────────────────
function HeatmapLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 12, zIndex: 800,
      background: 'rgba(13,17,23,0.85)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Density
      </div>
      <div style={{
        width: 110, height: 8, borderRadius: 4,
        background: 'linear-gradient(to right, #1e3a8a, #0ea5e9, #10b981, #f59e0b, #ef4444)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: '#475569' }}>Low</span>
        <span style={{ fontSize: 9, color: '#475569' }}>High</span>
      </div>
    </div>
  );
}

// ─── Main MapView ──────────────────────────────────────────────────────────────
export default function MapView() {
  const { heatPoints, routes, nodes, filters, setFilter } = useHeatmapStore(s => ({
    heatPoints: s.heatPoints,
    routes: s.routes,
    nodes: s.nodes,
    filters: s.filters,
    setFilter: s.setFilter,
  }));

  const handleSelectNode = useCallback((id: string | null) => {
    setFilter('selectedNodeId', id);
  }, [setFilter]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Custom tooltip styles injected once */}
      <style>{`
        .heatmap-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .heatmap-tooltip .leaflet-tooltip-content { padding: 0; }
        .leaflet-control-attribution { background: rgba(13,17,23,0.7) !important; color: #475569 !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: #64748b !important; }
      `}</style>

      <MapContainer
        center={AASTU_CENTER}
        zoom={17}
        style={{ width: '100%', height: '100%', background: '#0a0e1a' }}
        zoomControl={false}
        attributionControl={true}
      >
        {/* Dark map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Canvas heatmap overlay */}
        <HeatmapLayer heatPoints={heatPoints} />

        {/* Route polylines */}
        {filters.showRoutes && (
          <RoutesLayer routes={routes} nodes={nodes} visible={filters.showRoutes} />
        )}

        {/* Congestion cluster circles */}
        {filters.showClusters && (
          <ClustersLayer heatPoints={heatPoints} nodes={nodes} visible={filters.showClusters} />
        )}

        {/* Node dot markers */}
        <NodeMarkersLayer
          nodes={nodes}
          heatPoints={heatPoints}
          selectedNodeId={filters.selectedNodeId}
          onSelectNode={handleSelectNode}
        />

        <MapEventHandler />

        {/* Zoom controls (custom position) */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* react-leaflet's ZoomControl is placed by leaflet itself; we rely on default */}
        </div>
      </MapContainer>

      <HeatmapLegend />

      {/* Selected node info overlay */}
      <AnimatePresence>
        {filters.selectedNodeId && (() => {
          const node = nodes.find(n => n.id === filters.selectedNodeId);
          const hp = heatPoints.find(h => h.nodeId === filters.selectedNodeId);
          if (!node) return null;
          const color = NODE_TYPE_COLOR[node.type] || '#3b82f6';
          return (
            <motion.div
              key="node-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute', top: 12, left: 12, zIndex: 900,
                background: 'rgba(13,17,23,0.92)', border: `1px solid ${color}40`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 10, padding: '12px 14px', minWidth: 200,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{node.name}</div>
                  <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{node.type}</div>
                </div>
                <button
                  onClick={() => handleSelectNode(null)}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}
                >×</button>
              </div>
              {hp && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                  {[
                    ['Visits', hp.visits],
                    ['Active', hp.activeSessions],
                    ['Intensity', `${Math.round(hp.intensity * 100)}%`],
                    ['Peak Hour', `${hp.peakHour}:00`],
                    ['Avg Stay', `${Math.floor(hp.avgStaySeconds / 60)}m ${Math.round(hp.avgStaySeconds % 60)}s`],
                    ['Capacity', node.capacity],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
