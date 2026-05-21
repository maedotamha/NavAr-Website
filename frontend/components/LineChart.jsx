export default function LineChart({ data }){
  const max = Math.max(...data.map(item => Math.max(item.route_requests, item.successful_routes)), 1);
  const req = data.map((item,index)=>String(60 + index*92) + ',' + String(210 - item.route_requests/max*150)).join(' ');
  const ok = data.map((item,index)=>String(60 + index*92) + ',' + String(210 - item.successful_routes/max*150)).join(' ');
  return <svg className="chart" viewBox="0 0 680 250" role="img" aria-label="Navigation usage chart">
    {[0,1,2,3].map(i => <line key={i} x1="50" x2="650" y1={60+i*50} y2={60+i*50} />)}
    <polyline points={req} className="line primary" />
    <polyline points={ok} className="line success" />
    {data.map((item,index)=><text key={item.label} x={50 + index*92} y="238">{item.label}</text>)}
  </svg>;
}