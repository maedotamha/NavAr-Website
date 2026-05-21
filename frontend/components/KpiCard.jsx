export default function KpiCard({ label, value, tone }){
  return <section className="card kpi">
    <div className={'kpiIcon ' + tone}>{label.slice(0,2).toUpperCase()}</div>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </section>;
}