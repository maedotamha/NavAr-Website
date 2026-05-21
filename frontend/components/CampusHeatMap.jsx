'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { CAMPUS_BLOCKS, BLOCK_FLOOR_PLANS, FP_STYLE, HEAT_STOPS } from './campusData';

// ── Pure utilities ────────────────────────────────────────────────────────────

function heatRgb(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [t0, c0] = HEAT_STOPS[i - 1];
    const [t1, c1] = HEAT_STOPS[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1][1];
}

function heatCss(t, alpha) {
  const [r, g, b] = heatRgb(t);
  return alpha !== undefined ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

function polygonCentroid(pts) {
  let x = 0, y = 0;
  pts.forEach(([px, py]) => { x += px; y += py; });
  return [x / pts.length, y / pts.length];
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function scaleShape(shape, sx, sy) {
  return shape.map(([x, y]) => [x * sx, y * sy]);
}

function svgEl(tag, attrs = {}, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function metricValueStr(block, metric) {
  if (metric === 'usage')   return `${block.sessions.toLocaleString()} sessions`;
  if (metric === 'dwell')   return formatDuration(block.avgDwell);
  if (metric === 'qr')      return `${block.qrCount} codes`;
  if (metric === 'success') return `${block.successRate}%`;
  return '';
}

// ── Canvas drawing ────────────────────────────────────────────────────────────

function drawCampusCanvas(canvas, cs) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const sx = W / 780, sy = H / 460;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 40 * sx) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 40 * sy) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Campus boundary
  ctx.strokeStyle = 'rgba(102,87,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(18 * sx, 28 * sy, (752 - 18) * sx, (432 - 28) * sy);
  ctx.setLineDash([]);

  // Connector seams between blocks
  const corridors = [
    { x1:215, y1:148, x2:215, y2:205 },
    { x1:558, y1:148, x2:558, y2:248 },
    { x1:215, y1:298, x2:215, y2:328 },
    { x1:558, y1:268, x2:558, y2:328 }
  ];
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 6 * Math.min(sx, sy);
  corridors.forEach(c => {
    ctx.beginPath();
    ctx.moveTo(c.x1 * sx, c.y1 * sy);
    ctx.lineTo(c.x2 * sx, c.y2 * sy);
    ctx.stroke();
  });

  function getVal(block, bi) {
    const base = block[cs.metric];
    if (!cs.liveActive) return base;
    const wave = Math.sin(cs.liveTick * 0.04 + cs.liveOffsets[bi]) * 0.07;
    return Math.max(0.1, Math.min(1, base + wave));
  }

  CAMPUS_BLOCKS.forEach((block, bi) => {
    const pts = scaleShape(block.shape, sx, sy);
    const val = getVal(block, bi);
    const isHovered  = cs.hoveredBlock  === bi;
    const isSelected = cs.selectedBlock === bi;
    const [cx, cy] = polygonCentroid(pts);

    // Heat glow
    const glowR = Math.max(...pts.map(([px, py]) => Math.hypot(px - cx, py - cy))) * 1.6;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grd.addColorStop(0,   heatCss(val, 0.55));
    grd.addColorStop(0.6, heatCss(val, 0.20));
    grd.addColorStop(1,   heatCss(val, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    pts.forEach(([px, py], pi) => pi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fill();

    // Block fill
    ctx.fillStyle = heatCss(val, isHovered || isSelected ? 0.72 : 0.52);
    ctx.beginPath();
    pts.forEach(([px, py], pi) => pi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fill();

    // Block stroke
    ctx.strokeStyle = isSelected ? '#fff' : isHovered ? heatCss(val, 0.95) : heatCss(val, 0.6);
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.2;
    ctx.beginPath();
    pts.forEach(([px, py], pi) => pi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.stroke();

    // Block label
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    const lines = block.label.split('\n');
    ctx.font = `bold ${Math.round(10 * Math.min(sx, sy))}px Inter,sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lh = 13 * Math.min(sx, sy);
    lines.forEach((ln, li) => {
      ctx.fillText(ln, cx, cy + (li - (lines.length - 1) / 2) * lh);
    });
    ctx.restore();

    // Heat value pill above block
    const pval = Math.round(val * 100);
    ctx.save();
    ctx.font = `${Math.round(8 * Math.min(sx, sy))}px Inter,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pilTop = pts.reduce((mn, [, py]) => Math.min(mn, py), Infinity) - 14 * sy;
    ctx.fillStyle = heatCss(val, 0.9);
    const tw = ctx.measureText(`${pval}%`).width + 8 * sx;
    const pr = 4 * sy, px = cx - tw / 2, py2 = pilTop - 6 * sy, pw = tw, ph = 12 * sy;
    ctx.beginPath();
    ctx.moveTo(px + pr, py2);
    ctx.lineTo(px + pw - pr, py2);
    ctx.arcTo(px + pw, py2, px + pw, py2 + pr, pr);
    ctx.lineTo(px + pw, py2 + ph - pr);
    ctx.arcTo(px + pw, py2 + ph, px + pw - pr, py2 + ph, pr);
    ctx.lineTo(px + pr, py2 + ph);
    ctx.arcTo(px, py2 + ph, px, py2 + ph - pr, pr);
    ctx.lineTo(px, py2 + pr);
    ctx.arcTo(px, py2, px + pr, py2, pr);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(`${pval}%`, cx, pilTop);
    ctx.restore();
  });
}

// ── Floor plan SVG rendering ──────────────────────────────────────────────────

const FP_LEGEND_LABELS = {
  lobby:'Lobby', lab:'Laboratory', office:'Office', corridor:'Corridor',
  stair:'Stairwell', elevator:'Elevator', toilet:'Sanitary', service:'Service',
  meeting:'Meeting', library:'Library', parking:'Parking', ramp:'Ramp',
  shaft:'Shaft/Duct', balcony:'Balcony', bridge:'Bridge', parkslot:'Slot'
};

function renderFloorDetailSVG(blockId, floorIdx, svgDomEl) {
  const plans = BLOCK_FLOOR_PLANS[blockId];
  if (!plans) return;
  const plan = plans[floorIdx];
  if (!plan || !svgDomEl) return;

  while (svgDomEl.firstChild) svgDomEl.removeChild(svgDomEl.firstChild);

  // Glow filter
  const defs = svgEl('defs');
  const filt = svgEl('filter', { id: 'fpGlow' });
  filt.appendChild(svgEl('feGaussianBlur', { stdDeviation: '4', result: 'b' }));
  const merge = svgEl('feMerge');
  merge.appendChild(svgEl('feMergeNode', { in: 'b' }));
  merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
  filt.appendChild(merge);
  defs.appendChild(filt);
  svgDomEl.appendChild(defs);

  svgDomEl.appendChild(svgEl('rect', { x: 0, y: 0, width: 1000, height: 680, fill: '#0f172a' }));
  svgDomEl.appendChild(svgEl('text', {
    x: 500, y: 38, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: '#94a3b8', 'font-size': '13', 'font-family': 'Inter,sans-serif', 'font-weight': '600'
  }, `Block ${blockId}  ·  ${plan.label}`));

  for (const room of plan.rooms) {
    const style = FP_STYLE[room.type] || FP_STYLE.service;
    svgDomEl.appendChild(svgEl('rect', {
      x: room.x, y: room.y, width: room.w, height: room.h, rx: 3,
      fill: style.fill, stroke: style.stroke,
      'stroke-width': room.type === 'parkslot' ? 0.8 : 1.4,
    }));

    if (room.type === 'parkslot') {
      if (room.w >= 28 && room.h >= 14) {
        svgDomEl.appendChild(svgEl('text', {
          x: room.x + room.w / 2, y: room.y + room.h / 2,
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: '#93c5fd', 'font-size': '7.5', 'font-family': 'Inter,monospace'
        }, room.name));
      }
    } else if (room.w >= 46 && room.h >= 20) {
      const sepIdx = room.name.indexOf('  ');
      const mainText = sepIdx > 0 ? room.name.slice(0, sepIdx) : room.name;
      const areaText = sepIdx > 0 ? room.name.slice(sepIdx + 2) : '';
      const hasArea = areaText.length > 0 && room.h >= 44;
      const twoLines = hasArea || (mainText.length > 20 && room.h >= 44);
      const wrapAt = 20;
      const lineA = mainText.length > wrapAt && !hasArea
        ? mainText.slice(0, mainText.lastIndexOf(' ', wrapAt) || wrapAt) : mainText;
      const lineB = !hasArea && mainText.length > wrapAt
        ? mainText.slice((mainText.lastIndexOf(' ', wrapAt) || wrapAt) + 1) : areaText;
      const cx = room.x + room.w / 2, cy = room.y + room.h / 2, lineH = 12;

      if (twoLines && lineB) {
        svgDomEl.appendChild(svgEl('text', {
          x: cx, y: cy - lineH / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: '#f1f5f9', 'font-size': '9.5', 'font-family': 'Inter,sans-serif', 'font-weight': '500'
        }, lineA.length > 24 ? lineA.slice(0, 22) + '…' : lineA));
        svgDomEl.appendChild(svgEl('text', {
          x: cx, y: cy + lineH / 2 + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: hasArea ? style.stroke : '#cbd5e1',
          'font-size': hasArea ? '8.5' : '9', 'font-family': 'Inter,sans-serif'
        }, lineB));
      } else {
        svgDomEl.appendChild(svgEl('text', {
          x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: '#f1f5f9', 'font-size': '9.5', 'font-family': 'Inter,sans-serif', 'font-weight': '500'
        }, lineA.length > 26 ? lineA.slice(0, 24) + '…' : lineA));
      }
    }
  }

  // Legend
  const usedTypes = [...new Set(plan.rooms.map(r => r.type).filter(t => t !== 'parkslot'))];
  let lx = 14;
  for (const type of usedTypes) {
    const style = FP_STYLE[type] || FP_STYLE.service;
    const label = FP_LEGEND_LABELS[type] || type;
    svgDomEl.appendChild(svgEl('rect', {
      x: lx, y: 654, width: 10, height: 10, rx: 2,
      fill: style.fill, stroke: style.stroke, 'stroke-width': '1'
    }));
    svgDomEl.appendChild(svgEl('text', {
      x: lx + 13, y: 663, fill: '#94a3b8', 'font-size': '9', 'font-family': 'Inter,sans-serif'
    }, label));
    lx += label.length * 5.6 + 22;
    if (lx > 960) break;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const METRICS = [
  { value: 'usage',   label: 'AR Sessions' },
  { value: 'dwell',   label: 'Dwell Time'  },
  { value: 'qr',      label: 'QR Density'  },
  { value: 'success', label: 'Route Success'},
];

export default function CampusHeatMap() {
  const canvasRef    = useRef(null);
  const svgRef       = useRef(null);
  const rafRef       = useRef(null);
  const cinspTitleRef = useRef(null);
  const cinspSubRef   = useRef(null);
  const liveUsersRef  = useRef(null);
  const sessionsRef   = useRef(null);
  const avgSuccessRef = useRef(null);
  const blockListRef  = useRef(null);

  // Mutable campus state — read by drawing/event functions without React re-renders
  const cs = useRef({
    metric: 'usage',
    hoveredBlock: -1,
    selectedBlock: null,
    liveActive: false,
    liveTick: 0,
    liveOffsets: CAMPUS_BLOCKS.map(() => Math.random() * Math.PI * 2),
  });

  // React state — drives JSX updates
  const [metric,    setMetric]    = useState('usage');
  const [liveActive, setLiveActive] = useState(false);
  const [showFloor, setShowFloor] = useState(false);
  const [blockIdx,  setBlockIdx]  = useState(-1);
  const [floorIdx,  setFloorIdx]  = useState(0);

  // Keep refs in sync with React state so stable callbacks can read current values
  const showFloorRef = useRef(false);
  const blockIdxRef  = useRef(-1);
  const floorIdxRef  = useRef(0);
  showFloorRef.current = showFloor;
  blockIdxRef.current  = blockIdx;
  floorIdxRef.current  = floorIdx;

  // ── Drawing helpers ─────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    drawCampusCanvas(canvasRef.current, cs.current);
  }, []);

  const getBlockVal = useCallback((block, bi) => {
    const base = block[cs.current.metric];
    if (!cs.current.liveActive) return base;
    const wave = Math.sin(cs.current.liveTick * 0.04 + cs.current.liveOffsets[bi]) * 0.07;
    return Math.max(0.1, Math.min(1, base + wave));
  }, []);

  const updateInspector = useCallback((bi) => {
    const block = bi >= 0 ? CAMPUS_BLOCKS[bi] : null;
    if (cinspTitleRef.current)
      cinspTitleRef.current.textContent = block
        ? `Block ${block.id} — ${block.label.split('\n')[1] || ''}`
        : 'Campus Overview';
    if (cinspSubRef.current)
      cinspSubRef.current.textContent = block
        ? block.description
        : 'Hover or click a block to inspect';

    if (block) {
      const v = getBlockVal(block, bi);
      if (liveUsersRef.current)  liveUsersRef.current.textContent  = Math.round(block.sessions * v * 0.08).toLocaleString();
      if (sessionsRef.current)   sessionsRef.current.textContent   = block.sessions.toLocaleString();
      if (avgSuccessRef.current) avgSuccessRef.current.textContent = `${block.successRate}%`;
    } else {
      const total  = CAMPUS_BLOCKS.reduce((s, b) => s + b.sessions, 0);
      const avgSuc = Math.round(CAMPUS_BLOCKS.reduce((s, b) => s + b.successRate, 0) / CAMPUS_BLOCKS.length);
      if (liveUsersRef.current)  liveUsersRef.current.textContent  = Math.round(total * 0.05).toLocaleString();
      if (sessionsRef.current)   sessionsRef.current.textContent   = total.toLocaleString();
      if (avgSuccessRef.current) avgSuccessRef.current.textContent = `${avgSuc}%`;
    }
  }, [getBlockVal]);

  const renderBlockList = useCallback(() => {
    if (!blockListRef.current) return;
    blockListRef.current.innerHTML = CAMPUS_BLOCKS.map((block, bi) => {
      const val = getBlockVal(block, bi);
      const [r, g, b] = heatRgb(val);
      return `<div class="cinsp-block-item" data-bi="${bi}">
        <div class="cinsp-block-dot" style="background:rgb(${r},${g},${b})"></div>
        <span class="cinsp-block-name">Block ${block.id}</span>
        <span class="cinsp-block-val">${metricValueStr(block, cs.current.metric)}</span>
      </div>`;
    }).join('');
    blockListRef.current.querySelectorAll('.cinsp-block-item').forEach(item => {
      item.addEventListener('click', () => drillIntoBlock(parseInt(item.dataset.bi, 10)));
    });
  }, [getBlockVal]); // eslint-disable-line react-hooks/exhaustive-deps

  const drillIntoBlock = useCallback((bi) => {
    cs.current.selectedBlock = bi;
    setBlockIdx(bi);
    setFloorIdx(0);
    setShowFloor(true);
    drawCampusCanvas(canvasRef.current, cs.current);
  }, []);

  const backToCampus = useCallback(() => {
    cs.current.selectedBlock = null;
    setShowFloor(false);
    drawCampusCanvas(canvasRef.current, cs.current);
    updateInspector(-1);
  }, [updateInspector]);

  // ── Floor plan re-render when block/floor selection changes ─────────────────

  useEffect(() => {
    if (!showFloor || blockIdx < 0) return;
    const block = CAMPUS_BLOCKS[blockIdx];
    if (block) renderFloorDetailSVG(block.id, floorIdx, svgRef.current);
  }, [showFloor, blockIdx, floorIdx]);

  // ── Canvas mouse interactions ───────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function hitBlock(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top)  * sy;
      const csx = canvas.width  / 780;
      const csy = canvas.height / 460;
      for (let i = CAMPUS_BLOCKS.length - 1; i >= 0; i--) {
        if (pointInPolygon(mx, my, scaleShape(CAMPUS_BLOCKS[i].shape, csx, csy))) return i;
      }
      return -1;
    }

    function onMove(e) {
      const bi = hitBlock(e);
      if (bi !== cs.current.hoveredBlock) {
        cs.current.hoveredBlock = bi;
        canvas.style.cursor = bi >= 0 ? 'pointer' : 'crosshair';
        drawCampusCanvas(canvas, cs.current);
        updateInspector(bi);
      }
    }

    function onLeave() {
      cs.current.hoveredBlock = -1;
      canvas.style.cursor = 'crosshair';
      drawCampusCanvas(canvas, cs.current);
      updateInspector(-1);
    }

    function onClick(e) {
      const bi = hitBlock(e);
      if (bi >= 0) drillIntoBlock(bi);
    }

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [updateInspector, drillIntoBlock]);

  // ── Keyboard navigation (arrow keys when floor detail is open) ──────────────

  useEffect(() => {
    function onKey(e) {
      if (!showFloorRef.current) return;
      const bi = blockIdxRef.current;
      const fi = floorIdxRef.current;
      const block = CAMPUS_BLOCKS[bi];
      const plans = block ? BLOCK_FLOOR_PLANS[block.id] : null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (plans && fi < plans.length - 1) setFloorIdx(f => f + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (fi > 0) setFloorIdx(f => f - 1);
      } else if (e.key === 'Escape') {
        backToCampus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [backToCampus]);

  // ── Live animation loop ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!liveActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    function tick() {
      cs.current.liveTick++;
      drawCampusCanvas(canvasRef.current, cs.current);
      renderBlockList();
      if (cs.current.hoveredBlock >= 0) updateInspector(cs.current.hoveredBlock);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [liveActive, renderBlockList, updateInspector]);

  // ── Metric change ───────────────────────────────────────────────────────────

  useEffect(() => {
    cs.current.metric = metric;
    draw();
    renderBlockList();
    updateInspector(cs.current.hoveredBlock);
  }, [metric, draw, renderBlockList, updateInspector]);

  // ── Initial render ──────────────────────────────────────────────────────────

  useEffect(() => {
    draw();
    updateInspector(-1);
    renderBlockList();
  }, [draw, updateInspector, renderBlockList]);

  // ── Derived values for JSX ──────────────────────────────────────────────────

  const currentBlock = blockIdx >= 0 ? CAMPUS_BLOCKS[blockIdx] : null;
  const floorPlans   = currentBlock ? BLOCK_FLOOR_PLANS[currentBlock.id] : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="map-section panel" id="campusMapSection">
      <div className="panel-head">
        <div>
          <h2>AASTU RTC Campus — AR Navigation Heat Map</h2>
          <p>Live AR platform usage across 8 blocks. Click any block to inspect floors and zones.</p>
        </div>
        <div className="hmap-top-controls">
          <div className="segmented">
            {METRICS.map(m => (
              <button
                key={m.value}
                className={metric === m.value ? 'is-active' : ''}
                data-hmetric={m.value}
                onClick={() => setMetric(m.value)}
              >{m.label}</button>
            ))}
          </div>
          <button
            className={`ghost-button hmap-live-btn${liveActive ? ' is-live' : ''}`}
            onClick={() => {
              const next = !liveActive;
              cs.current.liveActive = next;
              setLiveActive(next);
            }}
          >{liveActive ? '⏹ Stop' : '▶ Live'}</button>
        </div>
      </div>

      {/* Campus canvas view — always mounted so canvasRef stays valid */}
      <div style={{ display: showFloor ? 'none' : undefined }}>
        <div className="campus-shell">
          <div className="campus-canvas-wrap">
            <canvas ref={canvasRef} width={860} height={460} style={{ width: '100%', height: 'auto', borderRadius: 10, background: '#0f172a', cursor: 'crosshair', display: 'block' }} />
            <div className="heat-legend-bar">
              <span>Low</span>
              <div className="heat-legend-gradient" />
              <span>High</span>
            </div>
          </div>
          <aside className="campus-inspector">
            <div className="cinsp-header">
              <h3 ref={cinspTitleRef}>Campus Overview</h3>
              <small ref={cinspSubRef}>Hover a block for details</small>
            </div>
            <div className="cinsp-stats">
              <div className="layer-stat"><span>Active Blocks</span><b>8</b></div>
              <div className="layer-stat"><span>AR Users Now</span><b ref={liveUsersRef}>—</b></div>
              <div className="layer-stat"><span>Sessions Today</span><b ref={sessionsRef}>—</b></div>
              <div className="layer-stat"><span>QR Anchors</span><b>1,247</b></div>
              <div className="layer-stat"><span>Avg Success</span><b ref={avgSuccessRef}>—</b></div>
            </div>
            <hr className="cinsp-divider" />
            <p className="cinsp-hint">Click a block to drill into floor-level AR heat map</p>
            <div className="cinsp-block-list" ref={blockListRef} />
          </aside>
        </div>
      </div>

      {/* Floor detail view */}
      <div style={{ display: showFloor ? undefined : 'none' }}>
        <div className="floor-nav">
          <div className="floor-nav-left">
            <button className="ghost-button small-btn" onClick={backToCampus}>← Campus</button>
            {currentBlock && (
              <span className="floor-block-label">
                Block {currentBlock.id} — {currentBlock.label.split('\n')[1] || ''}
              </span>
            )}
          </div>
          <div className="floor-stepper">
            <button
              className="ghost-button small-btn"
              disabled={floorIdx === 0}
              onClick={() => setFloorIdx(f => f - 1)}
            >‹ Prev Floor</button>
            <span className="floor-step-label">{floorPlans?.[floorIdx]?.label || ''}</span>
            <button
              className="ghost-button small-btn"
              disabled={!floorPlans || floorIdx >= floorPlans.length - 1}
              onClick={() => setFloorIdx(f => f + 1)}
            >Next Floor ›</button>
          </div>
          <div className="floor-tabs-scroll">
            {floorPlans?.map((plan, i) => (
              <button
                key={i}
                className={i === floorIdx ? 'is-active' : ''}
                onClick={() => setFloorIdx(i)}
              >{plan.label.replace(/ — .*/, '')}</button>
            ))}
          </div>
        </div>
        <div className="map-shell">
          <svg
            ref={svgRef}
            className="building-map"
            viewBox="0 0 1000 680"
            role="img"
            aria-label="Floor plan AR heat map"
          />
          <aside className="map-inspector">
            <h3>Floor Detail</h3>
            <div className="map-toggles">
              {['Heat', 'Routes', 'QR Codes', 'Nodes', 'POIs'].map(layer => (
                <label key={layer}><input type="checkbox" defaultChecked /> {layer}</label>
              ))}
            </div>
            <hr className="cinsp-divider" />
            <div className="layer-stat"><span>Zones</span><b>—</b></div>
            <div className="layer-stat"><span>Nodes</span><b>—</b></div>
            <div className="layer-stat"><span>POIs</span><b>—</b></div>
            <div className="layer-stat"><span>QR Anchors</span><b>{currentBlock?.qrCount ?? '—'}</b></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
