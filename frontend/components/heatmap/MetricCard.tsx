'use client';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'stable';
  accent?: string;
  icon?: React.ReactNode;
  animate?: boolean;
}

const TREND_ICONS = {
  up:     { symbol: '↑', color: '#22c55e' },
  down:   { symbol: '↓', color: '#ef4444' },
  stable: { symbol: '→', color: '#f59e0b' },
};

export default function MetricCard({
  label, value, sub, trend, accent = '#3b82f6', icon, animate = true,
}: MetricCardProps) {
  const trendInfo = trend ? TREND_ICONS[trend] : null;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse at top left, ${accent}0d 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: accent, opacity: 0.7, fontSize: 14 }}>{icon}</span>
        )}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </span>
        {trendInfo && (
          <span style={{ fontSize: 13, fontWeight: 700, color: trendInfo.color }}>
            {trendInfo.symbol}
          </span>
        )}
      </div>

      {/* Sub text */}
      {sub && (
        <span style={{ fontSize: 11, color: '#475569' }}>{sub}</span>
      )}
    </motion.div>
  );
}
