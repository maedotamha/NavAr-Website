'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SessionGrowthEntry } from '../lib/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const growth = payload[1]?.value ?? 0;
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 6px' }}>{label}</p>
      <p style={{ color: '#10b981', fontSize: 12, margin: '2px 0', fontWeight: 600 }}>
        Sessions: <span style={{ color: '#f0f4ff' }}>{payload[0]?.value}</span>
      </p>
      <p style={{ color: growth >= 0 ? '#22c55e' : '#ef4444', fontSize: 12, margin: '2px 0', fontWeight: 600 }}>
        Growth: <span>{growth >= 0 ? '+' : ''}{growth}%</span>
      </p>
    </div>
  );
};

export default function SessionGrowthChart({ data }: { data: SessionGrowthEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="growth-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="sessions"
          stroke="url(#growth-line)"
          strokeWidth={2.5}
          dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#10b981', stroke: '#0a0e1a', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="growth"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
