'use client';
import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';
import MetricCard from './MetricCard';
import PeakBarChart from './charts/PeakBarChart';
import NodeRankingChart from './charts/NodeRankingChart';
import LiveDensityGauge from './charts/LiveDensityGauge';

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

type MobileTab = 'summary' | 'hours' | 'nodes';

export default function MobileBottomSheet() {
  const { mobileSheetOpen, toggleMobileSheet, summary, hourlyData, nodeRanking } = useHeatmapStore(s => ({
    mobileSheetOpen: s.mobileSheetOpen,
    toggleMobileSheet: s.toggleMobileSheet,
    summary: s.summary,
    hourlyData: s.hourlyData,
    nodeRanking: s.nodeRanking,
  }));

  const [tab, setTab] = useState<MobileTab>('summary');
  const [expanded, setExpanded] = useState(false);

  const dragY = useMotionValue(0);

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (info.velocity.y > 300 || info.offset.y > 80) {
      toggleMobileSheet();
      setExpanded(false);
    } else if (info.offset.y < -60) {
      setExpanded(true);
    }
    dragY.set(0);
  }, [toggleMobileSheet, dragY]);

  const peakLabel = `${summary.peakHour}:00–${(summary.peakHour + 1) % 24}:00`;

  return (
    <>
      {/* FAB to open sheet */}
      {!mobileSheetOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={toggleMobileSheet}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 2000,
            width: 52, height: 52, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >📊</motion.button>
      )}

      <AnimatePresence>
        {mobileSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { toggleMobileSheet(); setExpanded(false); }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1900,
                background: 'rgba(0,0,0,0.4)',
              }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              drag="y"
              dragConstraints={{ top: expanded ? -200 : 0, bottom: 80 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              style={{ y: dragY }}
              initial={{ y: '100%' }}
              animate={{ y: expanded ? '-10%' : '0%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="mobile-sheet"
              aria-modal="true"
              role="dialog"
            >
              <style>{`
                .mobile-sheet {
                  position: fixed;
                  bottom: 0; left: 0; right: 0;
                  z-index: 2000;
                  background: rgba(10,14,26,0.98);
                  border-top: 1px solid rgba(255,255,255,0.1);
                  border-radius: 18px 18px 0 0;
                  max-height: 90vh;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                  touch-action: none;
                }
              `}</style>

              {/* Drag handle */}
              <div style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Sheet header */}
              <div style={{
                padding: '0 16px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>Analytics</div>
                <button
                  onClick={() => { toggleMobileSheet(); setExpanded(false); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}
                >×</button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', padding: '8px 12px', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {([['summary', 'Summary'], ['hours', 'Peak Hours'], ['nodes', 'Top Nodes']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                      flex: 1, background: tab === key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${tab === key ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 7, padding: '6px 0', cursor: 'pointer',
                      color: tab === key ? '#60a5fa' : '#475569', fontSize: 12, fontWeight: 600,
                    }}
                  >{label}</button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tab === 'summary' && (
                  <>
                    <LiveDensityGauge value={summary.systemLoadPct} label="System Load" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <MetricCard label="Active" value={summary.activeSessions} trend={summary.trend} accent="#3b82f6" animate={false} />
                      <MetricCard label="Congested" value={summary.congestedRouteCount} accent="#ef4444" animate={false} />
                      <MetricCard label="Avg Time" value={fmtTime(summary.avgTravelTimeSeconds)} accent="#10b981" animate={false} />
                      <MetricCard label="Peak Hour" value={peakLabel} accent="#f59e0b" animate={false} />
                    </div>
                    {summary.hottestNode && (
                      <MetricCard
                        label="Hottest Node"
                        value={summary.hottestNode.shortName}
                        sub={summary.hottestNode.name}
                        accent="#f97316"
                        icon="🔥"
                        animate={false}
                      />
                    )}
                  </>
                )}
                {tab === 'hours' && (
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Hourly congestion and session distribution</div>
                    <PeakBarChart data={hourlyData} />
                  </div>
                )}
                {tab === 'nodes' && (
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Top nodes by visit count</div>
                    <NodeRankingChart data={nodeRanking} />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
