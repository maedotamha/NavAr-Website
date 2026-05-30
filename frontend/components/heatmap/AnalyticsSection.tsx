'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';
import PeakBarChart from './charts/PeakBarChart';
import NodeRankingChart from './charts/NodeRankingChart';
import RouteUsageChart from './charts/RouteUsageChart';
import SessionGrowthChart from './charts/SessionGrowthChart';

type TabKey = 'peak' | 'nodes' | 'routes' | 'growth';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'peak',   label: 'Peak Hours',    color: '#f59e0b' },
  { key: 'nodes',  label: 'Node Ranking',  color: '#3b82f6' },
  { key: 'routes', label: 'Route Usage',   color: '#10b981' },
  { key: 'growth', label: 'Session Growth',color: '#8b5cf6' },
];

export default function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('peak');
  const { hourlyData, nodeRanking, routeUsage, sessionGrowth, analyticsOpen, toggleAnalytics } = useHeatmapStore(s => ({
    hourlyData: s.hourlyData,
    nodeRanking: s.nodeRanking,
    routeUsage: s.routeUsage,
    sessionGrowth: s.sessionGrowth,
    analyticsOpen: s.analyticsOpen,
    toggleAnalytics: s.toggleAnalytics,
  }));

  const activeColor = TABS.find(t => t.key === activeTab)?.color ?? '#3b82f6';

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(10,14,26,0.97)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
    }}>
      {/* Collapse toggle */}
      <button
        onClick={toggleAnalytics}
        style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '2px 18px', cursor: 'pointer',
          color: '#64748b', fontSize: 10, lineHeight: '18px', zIndex: 10,
        }}
      >
        {analyticsOpen ? '▼ Analytics' : '▲ Analytics'}
      </button>

      <AnimatePresence initial={false}>
        {analyticsOpen && (
          <motion.div
            key="analytics-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 16px' }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 10 }}>
                {TABS.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      background: activeTab === key ? `${color}18` : 'transparent',
                      border: `1px solid ${activeTab === key ? color + '50' : 'transparent'}`,
                      borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                      color: activeTab === key ? color : '#475569',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    }}
                  >{label}</button>
                ))}

                {/* Right side: summary pills */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>
                    {activeTab === 'peak' && `${hourlyData.filter(h => h.congestion > 60).length} high-congestion hours`}
                    {activeTab === 'nodes' && `Top ${Math.min(nodeRanking.length, 10)} of ${nodeRanking.length} nodes`}
                    {activeTab === 'routes' && `Top ${Math.min(routeUsage.length, 8)} routes`}
                    {activeTab === 'growth' && `${sessionGrowth.length} day${sessionGrowth.length !== 1 ? 's' : ''} of data`}
                  </span>
                </div>
              </div>

              {/* Chart panel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === 'peak'   && <PeakBarChart data={hourlyData} />}
                  {activeTab === 'nodes'  && <NodeRankingChart data={nodeRanking} />}
                  {activeTab === 'routes' && <RouteUsageChart data={routeUsage} />}
                  {activeTab === 'growth' && <SessionGrowthChart data={sessionGrowth} />}
                </motion.div>
              </AnimatePresence>

              {/* Chart label */}
              <div style={{ marginTop: 8, fontSize: 10, color: '#374151', textAlign: 'center' }}>
                {activeTab === 'peak'   && 'Hourly congestion % and session count across 24 hours'}
                {activeTab === 'nodes'  && 'Top nodes ranked by total visit count, coloured by node type'}
                {activeTab === 'routes' && 'Most-travelled routes ranked by usage frequency'}
                {activeTab === 'growth' && 'Daily session count and day-over-day growth rate'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
