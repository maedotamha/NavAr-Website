'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { RouteUsageEntry } from '../lib/types';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const mins = Math.floor(d.avgTime / 60);
  const secs = Math.round(d.avgTime % 60);
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', minWidth: 180 }}>
      <p style={{ color: '#f0f4ff', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>{d.label}</p>
      <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0' }}>
        Uses: <span style={{ color: '#10b981' }}>{d.count}</span>
      </p>
      <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0' }}>
        Avg time: <span style={{ color: '#94a3b8' }}>{mins > 0 ? `${mins}m ` : ''}{secs}s</span>
      </p>
    </div>
  );
};

const ROUTE_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#22c55e', '#ec4899', '#f97316',
  '#6366f1', '#14b8a6',
];

export default function RouteUsageChart({ data }: { data: RouteUsageEntry[] }) {
  const chartData = data.slice(0, 8).map(d => ({
    label: d.label,
    count: d.count,
    avgTime: d.avgTime,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 36, left: 4, bottom: 0 }} barSize={10}>
        <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="count" position="right" style={{ fill: '#475569', fontSize: 10 }} />
          {chartData.map((_, i) => (
            <Cell key={i} fill={ROUTE_COLORS[i % ROUTE_COLORS.length]} fillOpacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
