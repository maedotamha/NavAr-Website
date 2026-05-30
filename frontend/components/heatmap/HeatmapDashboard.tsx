'use client';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';
import TopBar from './TopBar';
import AnalyticsSidebar from './AnalyticsSidebar';
import AnalyticsSection from './AnalyticsSection';
import PlaybackBar from './PlaybackBar';
import MobileBottomSheet from './MobileBottomSheet';

// Leaflet must be dynamically imported to avoid SSR issues
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0e1a', color: '#475569', flexDirection: 'column', gap: 12,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        style={{ width: 28, height: 28, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%' }}
      />
      <span style={{ fontSize: 12 }}>Loading map…</span>
    </div>
  ),
});

const LIVE_INTERVAL_MS = 6000; // inject new sessions every 6s

export default function HeatmapDashboard() {
  const { filters, addLiveSessions, sidebarOpen } = useHeatmapStore(s => ({
    filters: s.filters,
    addLiveSessions: s.addLiveSessions,
    sidebarOpen: s.sidebarOpen,
  }));

  // Live session injection ticker
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!filters.isLive) {
      if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
      return;
    }
    // Dynamically import mock data generator to keep bundle lean in SSR
    import('./lib/mockData').then(({ generateLiveSessions }) => {
      liveRef.current = setInterval(() => {
        addLiveSessions(generateLiveSessions(Math.floor(Math.random() * 4) + 1));
      }, LIVE_INTERVAL_MS);
    });
    return () => {
      if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    };
  }, [filters.isLive, addLiveSessions]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100vh',
      background: '#0a0e1a',
      color: '#f0f4ff',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── Top filter bar ─────────────────────────────────────── */}
      <TopBar />

      {/* ── Main content area ──────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Left analytics sidebar ─────────────────────────── */}
        <AnalyticsSidebar />

        {/* ── Map + analytics column ─────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: sidebarOpen ? 272 : 0,
          transition: 'margin-left 0.3s',
        }}>
          {/* Map */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <MapView />
          </div>

          {/* Playback bar */}
          <PlaybackBar />

          {/* Bottom analytics section */}
          <AnalyticsSection />
        </div>
      </div>

      {/* ── Mobile bottom sheet (hidden on desktop) ────────────── */}
      <MobileBottomSheet />
    </div>
  );
}
