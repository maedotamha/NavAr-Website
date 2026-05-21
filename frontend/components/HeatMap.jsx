const heatStops = [
  [0, [10, 120, 255]],
  [0.25, [0, 212, 200]],
  [0.45, [60, 255, 60]],
  [0.65, [255, 220, 0]],
  [0.82, [255, 100, 0]],
  [1, [255, 0, 80]]
];

function heatRgb(value){
  const t = Math.max(0, Math.min(1, value));
  for(let i = 1; i < heatStops.length; i++){
    const [startT, startColor] = heatStops[i - 1];
    const [endT, endColor] = heatStops[i];
    if(t <= endT){
      const factor = (t - startT) / (endT - startT);
      return startColor.map((channel, index) => Math.round(channel + factor * (endColor[index] - channel)));
    }
  }
  return heatStops[heatStops.length - 1][1];
}

function heatCss(value, alpha = 1){
  const [r, g, b] = heatRgb(value);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function polygonCentroid(points){
  const total = points.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function metricValue(block, metric){
  if(metric === 'dwell') return block.dwell;
  if(metric === 'qr') return block.qr;
  if(metric === 'success') return block.successScore;
  return block.usage;
}

function metricLabel(block, metric){
  if(metric === 'dwell') return `${block.avgDwell}s dwell`;
  if(metric === 'qr') return `${block.qrCount} QR`;
  if(metric === 'success') return `${block.successRate}% success`;
  return `${block.sessions.toLocaleString()} sessions`;
}

export default function HeatMap({ blocks, activeBlockId, metric = 'usage', onSelectBlock }){
  return <div className="campusMapCanvas" role="img" aria-label="AASTU RTC campus AR heat map">
    <svg viewBox="0 0 780 460" className="campusMapSvg">
      <defs>
        <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
        </pattern>
        <filter id="campusGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width="780" height="460" fill="#0f172a" />
      <rect x="0" y="0" width="780" height="460" fill="url(#campusGrid)" />
      <rect x="18" y="28" width="734" height="404" rx="12" className="campusBoundary" />
      <path d="M215 148 L215 205 M558 148 L558 248 M215 298 L215 328 M558 268 L558 328" className="campusConnector" />
      {blocks.map(block => {
        const value = metricValue(block, metric);
        const fill = heatCss(value, activeBlockId === block.id ? 0.78 : 0.56);
        const stroke = activeBlockId === block.id ? '#fff' : heatCss(value, 0.95);
        const points = block.shape.map(point => point.join(',')).join(' ');
        const [cx, cy] = polygonCentroid(block.shape);
        const lines = block.label.split('\n');
        return <g key={block.id} className="campusBlock" onClick={() => onSelectBlock?.(block)} tabIndex="0" role="button" aria-label={`Select Block ${block.id}`}>
          <polygon points={points} fill={heatCss(value, 0.28)} filter="url(#campusGlow)" />
          <polygon points={points} fill={fill} stroke={stroke} strokeWidth={activeBlockId === block.id ? 3 : 1.5} />
          <text x={cx} y={cy - 7} className="campusBlockTitle">{lines[0]}</text>
          <text x={cx} y={cy + 10} className="campusBlockSub">{lines[1]}</text>
          <g transform={`translate(${cx - 28} ${Math.max(14, block.shape.reduce((min, [, y]) => Math.min(min, y), 460) - 24)})`}>
            <rect width="56" height="18" rx="9" fill={heatCss(value, 0.95)} />
            <text x="28" y="13" className="campusValue">{Math.round(value * 100)}%</text>
          </g>
          <title>{`Block ${block.id}: ${metricLabel(block, metric)}`}</title>
        </g>;
      })}
      <path d="M220 184 C290 154 326 238 384 238 C446 238 492 178 558 188" className="campusRoute primary" />
      <path d="M220 330 C285 350 326 336 384 326 C446 312 492 340 558 328" className="campusRoute secondary" />
      {blocks.map(block => {
        const [cx, cy] = polygonCentroid(block.shape);
        return <g key={`${block.id}-qr`} className="campusQr">
          <rect x={cx - 10} y={cy + 26} width="20" height="20" rx="5" />
          <text x={cx} y={cy + 40}>QR</text>
        </g>;
      })}
    </svg>
    <div className="heatLegendBar"><span>Low</span><i /><span>High</span></div>
  </div>;
}
