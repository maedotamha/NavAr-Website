'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  value: number;   // 0–100
  label?: string;
}

function getColor(v: number) {
  if (v >= 80) return '#ef4444';
  if (v >= 60) return '#f59e0b';
  if (v >= 35) return '#3b82f6';
  return '#10b981';
}

function getLabel(v: number) {
  if (v >= 80) return 'Critical';
  if (v >= 60) return 'High';
  if (v >= 35) return 'Moderate';
  return 'Low';
}

export default function LiveDensityGauge({ value, label }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getColor(clamped);
  const statusLabel = getLabel(clamped);

  // Half-donut gauge: full angle = 180°
  // We split into: filled arc + empty arc
  const TOTAL = 180;
  const filled = (clamped / 100) * TOTAL;
  const empty = TOTAL - filled;

  // recharts half-donut trick: startAngle=180 endAngle=0, two segments
  const gaugeData = [
    { value: filled },
    { value: empty },
  ];

  // Tick marks (5 marks at 0,25,50,75,100)
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: 160 }}>
      {/* Gauge chart */}
      <div style={{ position: 'relative', width: '100%', height: 130 }}>
        <ResponsiveContainer width="100%" height={130}>
          <PieChart>
            {/* Track */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={72}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
            {/* Fill */}
            <Pie
              data={gaugeData}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={72}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{clamped}%</div>
          <div style={{ fontSize: 11, color: color, opacity: 0.8, marginTop: 2, fontWeight: 600 }}>{statusLabel}</div>
        </div>
      </div>

      {/* Tick labels */}
      <div style={{
        position: 'absolute',
        bottom: 2,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 160,
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        {ticks.map(t => (
          <span key={t} style={{ fontSize: 9, color: '#475569' }}>{t}</span>
        ))}
      </div>

      {/* Optional label */}
      {label && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' }}>{label}</div>
      )}
    </div>
  );
}
