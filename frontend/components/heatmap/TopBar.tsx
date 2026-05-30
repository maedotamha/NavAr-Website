'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';
import type { TimeRange, NodeType } from './lib/types';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h',  label: '1H'  },
  { value: '6h',  label: '6H'  },
  { value: '12h', label: '12H' },
  { value: '24h', label: '24H' },
  { value: '7d',  label: '7D'  },
];

const NODE_TYPES: NodeType[] = [
  'entrance', 'classroom', 'lab', 'cafeteria', 'library',
  'admin', 'parking', 'sports', 'dormitory', 'auditorium',
];

const TYPE_COLORS: Record<string, string> = {
  entrance: '#06b6d4', classroom: '#3b82f6', lab: '#8b5cf6',
  cafeteria: '#f59e0b', library: '#10b981', admin: '#64748b',
  parking: '#475569', sports: '#22c55e', dormitory: '#ec4899', auditorium: '#f97316',
};

export default function TopBar() {
  const { filters, setFilter, setSearchQuery, toggleLive, summary } = useHeatmapStore(s => ({
    filters: s.filters,
    setFilter: s.setFilter,
    setSearchQuery: s.setSearchQuery,
    toggleLive: s.toggleLive,
    summary: s.summary,
  }));

  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showDensitySlider, setShowDensitySlider] = useState(false);

  const toggleNodeType = useCallback((type: NodeType) => {
    const current = filters.nodeTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setFilter('nodeTypes', next);
  }, [filters.nodeTypes, setFilter]);

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      background: 'rgba(10,14,26,0.95)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(12px)',
      flexWrap: 'nowrap',
      minHeight: 52,
      zIndex: 1000,
    }}>

      {/* Logo / title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#fff',
        }}>H</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', whiteSpace: 'nowrap' }}>
          Heatmap Analytics
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 260 }}>
        <svg
          viewBox="0 0 16 16" width="13" height="13"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fill: '#475569', pointerEvents: 'none' }}
        >
          <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12zm4.243-1.757 2.757 2.757-1.414 1.414-2.757-2.757A7.96 7.96 0 0 1 7 15a8 8 0 1 1 8-8 7.96 7.96 0 0 1-1.757 5.243z"/>
        </svg>
        <input
          value={filters.searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search nodes…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7, padding: '6px 10px 6px 30px',
            color: '#f0f4ff', fontSize: 12, outline: 'none',
          }}
        />
        {filters.searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
          >×</button>
        )}
      </div>

      {/* Time Range Selector */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: 2, border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {TIME_RANGES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter('timeRange', value)}
            style={{
              padding: '4px 10px', border: 'none', borderRadius: 5, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
              background: filters.timeRange === value ? '#3b82f6' : 'transparent',
              color: filters.timeRange === value ? '#fff' : '#64748b',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Node Type Filter */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowTypeFilter(v => !v); setShowDensitySlider(false); }}
          style={{
            background: filters.nodeTypes.length > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${filters.nodeTypes.length > 0 ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
            color: filters.nodeTypes.length > 0 ? '#60a5fa' : '#94a3b8',
            fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span>Types</span>
          {filters.nodeTypes.length > 0 && (
            <span style={{ background: '#3b82f6', borderRadius: 10, padding: '1px 6px', fontSize: 10, color: '#fff' }}>
              {filters.nodeTypes.length}
            </span>
          )}
        </button>
        <AnimatePresence>
          {showTypeFilter && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 2000,
                background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px', width: 240,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Filter by node type
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {NODE_TYPES.map(type => {
                  const active = filters.nodeTypes.includes(type);
                  const color = TYPE_COLORS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => toggleNodeType(type)}
                      style={{
                        background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? color + '60' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 5, padding: '4px 9px',
                        color: active ? color : '#64748b', fontSize: 11, cursor: 'pointer',
                        fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                      }}
                    >{type}</button>
                  );
                })}
              </div>
              {filters.nodeTypes.length > 0 && (
                <button
                  onClick={() => setFilter('nodeTypes', [])}
                  style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, padding: '4px 0' }}
                >Clear all</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Density Threshold */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowDensitySlider(v => !v); setShowTypeFilter(false); }}
          style={{
            background: filters.densityThreshold > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${filters.densityThreshold > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
            color: filters.densityThreshold > 0 ? '#f59e0b' : '#94a3b8',
            fontSize: 12, fontWeight: 600,
          }}
        >
          Density {filters.densityThreshold > 0 ? `≥${Math.round(filters.densityThreshold * 100)}%` : 'All'}
        </button>
        <AnimatePresence>
          {showDensitySlider && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 2000,
                background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', width: 220,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Min density threshold
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={filters.densityThreshold}
                onChange={e => setFilter('densityThreshold', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 4 }}>
                <span>0%</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{Math.round(filters.densityThreshold * 100)}%</span>
                <span>100%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle switches */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {([
          ['Routes', 'showRoutes'],
          ['Clusters', 'showClusters'],
        ] as const).map(([label, key]) => (
          <button
            key={key}
            onClick={() => setFilter(key, !filters[key])}
            style={{
              background: filters[key] ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
              color: filters[key] ? '#94a3b8' : '#374151', fontSize: 11,
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: filters[key] ? '#10b981' : '#374151', marginRight: 5,
              verticalAlign: 'middle',
            }} />
            {label}
          </button>
        ))}
      </div>

      {/* Live toggle */}
      <button
        onClick={toggleLive}
        style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          background: filters.isLive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${filters.isLive ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
          color: filters.isLive ? '#22c55e' : '#475569', fontSize: 12, fontWeight: 600,
          transition: 'all 0.2s',
        }}
      >
        {filters.isLive && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}
          />
        )}
        {filters.isLive ? 'Live' : 'Paused'}
      </button>

      {/* Active sessions badge */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 7, padding: '5px 11px',
      }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Active</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{summary.activeSessions}</span>
      </div>

      {/* Close dropdowns on outside click */}
      {(showTypeFilter || showDensitySlider) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1999 }}
          onClick={() => { setShowTypeFilter(false); setShowDensitySlider(false); }}
        />
      )}
    </div>
  );
}
