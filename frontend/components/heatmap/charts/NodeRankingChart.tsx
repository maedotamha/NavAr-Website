'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { NodeRankEntry } from '../lib/types';

const NODE_TYPE_COLORS: Record<string, string> = {
  entrance: '#06b6d4', classroom: '#3b82f6', lab: '#8b5cf6',
  cafeteria: '#f59e0b', library: '#10b981', admin: '#64748b',
  parking: '#475569', sports: '#22c55e', dormitory: '#ec4899', auditorium: '#f97316',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '10px 14px', minWidth: 160 }}>
      <p style={{ color: '#f0f4ff', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>{d.name}</p>
      <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0' }}>Visits: <span style={{ color: '#3b82f6' }}>{d.visits}</span></p>
      <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0' }}>Congestion: <span style={{ color: d.congestionPct > 70 ? '#ef4444' : '#f59e0b' }}>{d.congestionPct}%</span></p>
      <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0' }}>Peak: <span style={{ color: '#94a3b8' }}>{d.peakHour}:00</span></p>
    </div>
  );
};

export default function NodeRankingChart({ data }: { data: NodeRankEntry[] }) {
  const chartData = data.slice(0, 10).map(d => ({
    name: d.node.shortName,
    visits: d.visits,
    congestionPct: d.congestionPct,
    peakHour: d.peakHour,
    type: d.node.type,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barSize={12}>
        <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={65} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
        <Bar dataKey="visits" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="visits" position="right" style={{ fill: '#475569', fontSize: 10 }} />
          {chartData.map((d, i) => (
            <Cell key={i} fill={NODE_TYPE_COLORS[d.type] || '#3b82f6'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
