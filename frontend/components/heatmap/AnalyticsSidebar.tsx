'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';
import MetricCard from './MetricCard';
import TrafficAreaChart from './charts/TrafficAreaChart';
import LiveDensityGauge from './charts/LiveDensityGauge';

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function AnalyticsSidebar() {
  const { summary, trafficOverTime, sidebarOpen, toggleSidebar, filters, nodes } = useHeatmapStore(s => ({
    summary: s.summary,
    trafficOverTime: s.trafficOverTime,
    sidebarOpen: s.sidebarOpen,
    toggleSidebar: s.toggleSidebar,
    filters: s.filters,
    nodes: s.nodes,
  }));

  const peakLabel = `${summary.peakHour}:00 – ${summary.peakHour + 1}:00`;

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          top: '50%',
          left: sidebarOpen ? 272 : 0,
          transform: 'translateY(-50%)',
          zIndex: 1100,
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: sidebarOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: sidebarOpen ? '0 6px 6px 0' : '0 6px 6px 0',
          color: '#64748b',
          cursor: 'pointer',
          padding: '10px 5px',
          transition: 'left 0.3s',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 272,
              zIndex: 1000,
              background: 'rgba(10,14,26,0.96)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Live Overview</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                  {filters.timeRange.toUpperCase()} window · {nodes.length} nodes
                </div>
              </div>
              <div style={{
                padding: '2px 8px', borderRadius: 10,
                background: summary.trend === 'up' ? 'rgba(34,197,94,0.15)' : summary.trend === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color: summary.trend === 'up' ? '#22c55e' : summary.trend === 'down' ? '#ef4444' : '#f59e0b',
                fontSize: 11, fontWeight: 700,
              }}>
                {summary.trend === 'up' ? '↑ Rising' : summary.trend === 'down' ? '↓ Quiet' : '→ Stable'}
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Live Density Gauge */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '10px 8px',
              }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, textAlign: 'center' }}>
                  System Load
                </div>
                <LiveDensityGauge value={summary.systemLoadPct} />
              </div>

              {/* Metric Cards */}
              <MetricCard
                label="Active Sessions"
                value={summary.activeSessions}
                sub="Currently traversing campus"
                trend={summary.trend}
                accent="#3b82f6"
                icon="🧍"
              />
              <MetricCard
                label="Congested Routes"
                value={summary.congestedRouteCount}
                sub="Routes above 60% capacity"
                accent="#ef4444"
                icon="🔴"
              />
              <MetricCard
                label="Avg Travel Time"
                value={fmtTime(summary.avgTravelTimeSeconds)}
                sub="Per session"
                accent="#10b981"
                icon="⏱"
              />
              <MetricCard
                label="Peak Hour"
                value={peakLabel}
                sub="Highest session density"
                accent="#f59e0b"
                icon="📈"
              />
              {summary.hottestNode && (
                <MetricCard
                  label="Hottest Node"
                  value={summary.hottestNode.shortName}
                  sub={summary.hottestNode.name}
                  accent="#f97316"
                  icon="🔥"
                />
              )}

              {/* Mini traffic chart */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '10px 8px 4px',
              }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Traffic Over Time
                </div>
                <TrafficAreaChart data={trafficOverTime} />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
