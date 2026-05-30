'use client';
import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHeatmapStore } from './stores/useHeatmapStore';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SPEED_OPTIONS: Array<0.5 | 1 | 2 | 4> = [0.5, 1, 2, 4];

export default function PlaybackBar() {
  const { playback, setPlayback, filters, setFilter, recompute } = useHeatmapStore(s => ({
    playback: s.playback,
    setPlayback: s.setPlayback,
    filters: s.filters,
    setFilter: s.setFilter,
    recompute: s.recompute,
  }));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    intervalRef.current = setInterval(() => {
      const { playback: pb, setPlayback: sp } = useHeatmapStore.getState();
      sp({ currentHour: (pb.currentHour + 1) % 24 });
    }, Math.round(1500 / playback.speed));
  }, [playback.speed, stopTicker]);

  useEffect(() => {
    if (playback.isPlaying) {
      startTicker();
    } else {
      stopTicker();
    }
    return stopTicker;
  }, [playback.isPlaying, playback.speed, startTicker, stopTicker]);

  const toggle = () => {
    if (playback.mode === 'live') {
      // Switch to replay mode
      setPlayback({ mode: 'replay', isPlaying: true, currentHour: 0 });
      setFilter('isLive', false);
    } else {
      setPlayback({ isPlaying: !playback.isPlaying });
    }
  };

  const setHour = (h: number) => {
    setPlayback({ currentHour: h, isPlaying: false });
  };

  const exitReplay = () => {
    stopTicker();
    setPlayback({ mode: 'live', isPlaying: false, currentHour: new Date().getHours() });
    setFilter('isLive', true);
  };

  if (playback.mode === 'live') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'rgba(10,14,26,0.92)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Playback</span>
        <button
          onClick={toggle}
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
            color: '#818cf8', fontSize: 11, fontWeight: 600,
          }}
        >⏵ Enter Replay Mode</button>
        <span style={{ fontSize: 10, color: '#374151', marginLeft: 4 }}>
          Replay historical session data hour by hour
        </span>
      </div>
    );
  }

  // ── Replay mode ──────────────────────────────────────────────────────────────
  const h = playback.currentHour;
  const label = `${String(h).padStart(2, '0')}:00 – ${String((h + 1) % 24).padStart(2, '0')}:00`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      background: 'rgba(10,14,26,0.97)',
      borderTop: '1px solid rgba(99,102,241,0.2)',
      backdropFilter: 'blur(8px)',
      flexWrap: 'nowrap',
    }}>
      {/* Play/Pause */}
      <button
        onClick={toggle}
        style={{
          width: 30, height: 30, borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', fontSize: 13, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {playback.isPlaying ? '⏸' : '⏵'}
      </button>

      {/* Current time label */}
      <div style={{ flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{label}</div>
        <div style={{ fontSize: 9, color: '#374151', textTransform: 'uppercase' }}>Replay</div>
      </div>

      {/* Timeline scrubber */}
      <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          background: 'rgba(255,255,255,0.08)', borderRadius: 2,
        }} />
        <motion.div
          style={{
            position: 'absolute', left: 0, height: 4,
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            borderRadius: 2,
            width: `${(h / 23) * 100}%`,
            transition: 'width 0.3s',
          }}
        />
        <input
          type="range"
          min={0}
          max={23}
          step={1}
          value={h}
          onChange={e => setHour(parseInt(e.target.value))}
          style={{
            position: 'absolute', left: 0, right: 0, width: '100%',
            opacity: 0, height: 20, cursor: 'pointer', margin: 0,
          }}
        />
        {/* Hour ticks */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {[0, 6, 12, 18, 23].map(tick => (
            <span key={tick} style={{ fontSize: 8, color: '#374151' }}>
              {String(tick).padStart(2,'0')}
            </span>
          ))}
        </div>
      </div>

      {/* Speed selector */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {SPEED_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setPlayback({ speed: s })}
            style={{
              background: playback.speed === s ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${playback.speed === s ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 5, padding: '3px 7px',
              color: playback.speed === s ? '#818cf8' : '#475569',
              fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >{s}×</button>
        ))}
      </div>

      {/* Exit replay */}
      <button
        onClick={exitReplay}
        style={{
          flexShrink: 0,
          background: 'none', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
          color: '#475569', fontSize: 11,
        }}
      >✕ Live</button>
    </div>
  );
}
