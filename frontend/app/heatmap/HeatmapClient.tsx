'use client';
import dynamic from 'next/dynamic';

const HeatmapDashboard = dynamic(
  () => import('../../components/heatmap/HeatmapDashboard'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0e1a',
        flexDirection: 'column',
        gap: 16,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(59,130,246,0.15)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Loading heatmap dashboard…</p>
      </div>
    ),
  }
);

export default function HeatmapClient() {
  return <HeatmapDashboard />;
}
