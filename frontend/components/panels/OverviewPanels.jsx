'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Pill, PHead, Empty, Spin, Err, Btn, Input, Sel, FGrid, TTable, TD, MsgBox } from './shared';

export function OverviewPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getDashboard(tok()));
  const { data: outdoorData, loading: outdoorLoading } = useFetch(() => api.getOutdoorAnalytics(tok()));
  if (loading) return <article className="actualPanel"><Spin /></article>;
  if (error) return <article className="actualPanel"><Err msg={error} reload={reload} /></article>;
  const { kpis = {}, floorData = {}, navigationUsage = [], popularNodes = [], systemStatus = [] } = data || {};
  const outdoorStats = outdoorData?.stats || {};
  const outdoorRecent = Array.isArray(outdoorData?.recent) ? outdoorData.recent : [];
  const outdoorSearches = Array.isArray(outdoorData?.searches) ? outdoorData.searches : [];
  const kpiDefs = [['Buildings', kpis.buildings, '#3b82f6', '#dbeafe'], ['Nodes', kpis.nodes, '#6d5dfc', '#ede9fe'], ['Floor Nodes', floorData.nodes, '#0f766e', '#ccfbf1'], ['Floor POIs', floorData.destinations, '#be123c', '#ffe4e6'], ['AR Anchors', floorData.anchors || kpis.markers, '#f59e0b', '#ffedd5'], ['Sessions', kpis.sessions, '#ef4444', '#fee2e2']];
  const outdoorKpis = [
    ['Outdoor Sessions', outdoorStats.total],
    ['Completed', outdoorStats.completed],
    ['Today', outdoorStats.today],
    ['GPS Positions', outdoorStats.positions],
    ['Searches', outdoorStats.searches],
    ['Completion', outdoorStats.completion != null ? `${outdoorStats.completion}%` : null]
  ];
  const maxReq = Math.max(...navigationUsage.map(d => d.route_requests || 0), 1);
  return (
    <>
      <div className="actualMetricGrid">
        {kpiDefs.map(([label, val, color, bg]) => (
          <article className="actualMetric" key={label}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, color, display: 'grid', placeItems: 'center', fontWeight: 900, marginBottom: 8, fontSize: 13 }}>{label[0]}</div>
            <small>{label}</small><strong>{val ?? '–'}</strong>
          </article>
        ))}
      </div>
      <article className="actualPanel">
        <PHead title="Outdoor Navigation Stats" action={<span>{outdoorLoading ? 'Loading' : 'AASTU Navigator'}</span>} />
        <div className="actualMetricGrid" style={{ padding: '0 20px 20px', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
          {outdoorKpis.map(([label, value]) => (
            <div key={label} style={{ border: '1px solid #eef2f7', borderRadius: 8, padding: 14, background: '#fbfdff' }}>
              <small style={{ color: '#64748b', display: 'block', fontSize: 12 }}>{label}</small>
              <strong style={{ display: 'block', marginTop: 6, fontSize: 22 }}>{value ?? '-'}</strong>
            </div>
          ))}
        </div>
      </article>
      <div className="actualGrid">
        <article className="actualPanel">
          <PHead title="Weekly Navigation Traffic" />
          <div style={{ padding: '0 20px 20px', display: 'grid', gap: 10 }}>
            {navigationUsage.map(d => {
              const pct = Math.round(((d.route_requests || 0) / maxReq) * 100);
              return (
                <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 46px', gap: 8, alignItems: 'center' }}>
                  <small style={{ color: '#94a3b8', fontSize: 11 }}>{d.label}</small>
                  <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6d5dfc,#60a5fa)', borderRadius: 999 }} />
                  </div>
                  <small style={{ fontSize: 12, color: '#475569', textAlign: 'right' }}>{d.route_requests}</small>
                </div>
              );
            })}
          </div>
        </article>
        <article className="actualPanel">
          <PHead title="System Status" />
          <div style={{ padding: '0 20px 20px' }}>
            {systemStatus.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px #dcfce7', display: 'block', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                </div>
                <small style={{ color: '#64748b', fontSize: 12 }}>{s.status}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
      {popularNodes.length > 0 && (
        <article className="actualPanel">
          <PHead title="Popular Destinations" count={popularNodes.length} />
          <div className="actualTable">
            {popularNodes.map(n => (
              <div key={n.id}><b>{n.node_name}</b><span>{n.visits} visits</span><Pill v={n.visits > 10 ? 'Popular' : 'Active'} /></div>
            ))}
          </div>
        </article>
      )}
      <div className="actualGrid">
        <article className="actualPanel">
          <PHead title="Recent Outdoor Sessions" count={outdoorRecent.length} />
          {outdoorLoading ? <Spin /> : outdoorRecent.length === 0 ? <Empty /> : (
            <TTable
              heads={['From', 'To', 'Length', 'Status']}
              rows={outdoorRecent.slice(0, 8)}
              renderRow={session => (
                <>
                  <TD><b>{session.from_name || '-'}</b></TD>
                  <TD muted>{session.to_name || '-'}</TD>
                  <TD>{session.route_length ? `${Math.round(session.route_length)}m` : '-'}</TD>
                  <TD><Pill v={Number(session.completed) === 1 || session.completed === true ? 'Successful' : 'Failed'} /></TD>
                </>
              )}
            />
          )}
        </article>
        <article className="actualPanel">
          <PHead title="Top Outdoor Searches" count={outdoorSearches.length} />
          {outdoorLoading ? <Spin /> : outdoorSearches.length === 0 ? <Empty /> : (
            <div className="actualTable">
              {outdoorSearches.slice(0, 8).map(search => (
                <div key={search.name}>
                  <b>{search.name}</b>
                  <span>{search.count || 0} searches</span>
                  <Pill v="Active" />
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}

export function HeatMapPanel() {
  const { data: dashboardData, loading: dashboardLoading } = useFetch(() => api.getDashboard(tok()));
  const { data: outdoorData, loading: outdoorLoading } = useFetch(() => api.getOutdoorAnalytics(tok()));
  const rawOutdoor = Array.isArray(outdoorData?.heatmap) ? outdoorData.heatmap : [];
  const lats = rawOutdoor.map(([lat]) => Number(lat)).filter(Number.isFinite);
  const lngs = rawOutdoor.map(([, lng]) => Number(lng)).filter(Number.isFinite);
  const minLat = Math.min(...lats, 0);
  const maxLat = Math.max(...lats, 1);
  const minLng = Math.min(...lngs, 0);
  const maxLng = Math.max(...lngs, 1);
  const outdoorPts = rawOutdoor.slice(0, 18).map(([lat, lng, weight], index) => ({
    node_name: `GPS ${index + 1}`,
    latitude: Number(lat),
    longitude: Number(lng),
    intensity: weight
  }));
  const pts = outdoorPts.length ? outdoorPts : (dashboardData?.heatPoints || []).slice(0, 6);
  const tones = ['hot', 'hot', 'warm', 'warm', 'cool', 'cool'];
  const fallbackPos = [[66, 32], [35, 50], [57, 68], [22, 28], [77, 60], [50, 18]];
  const maxWeight = Math.max(...pts.map(point => Number(point.intensity) || 0), 1);
  return (
    <article className="actualPanel heatMapPanel">
      <PHead title="Outside Navigation Heat Map" action={<span style={{ fontSize: 12, color: '#94a3b8' }}>{outdoorPts.length ? 'Outdoor GPS feed' : 'Indoor fallback'}</span>} />
      {dashboardLoading || outdoorLoading ? <Spin /> : (
        <>
          <div className="heatMapCanvas">
            {pts.length === 0 ? <Empty msg="No heat map points found" /> : pts.map((p, i) => {
              const normalized = Math.max(0.18, (Number(p.intensity) || 0) / maxWeight);
              const left = outdoorPts.length && maxLng !== minLng ? 8 + ((p.longitude - minLng) / (maxLng - minLng)) * 84 : fallbackPos[i]?.[0] || 50;
              const top = outdoorPts.length && maxLat !== minLat ? 92 - ((p.latitude - minLat) / (maxLat - minLat)) * 84 : fallbackPos[i]?.[1] || 50;
              const size = 34 + normalized * 70;
              return (
                <span className={`heatPoint ${tones[i] || 'cool'}`} key={`${p.node_name}-${i}`}
                  style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}>
                  <b style={{ fontSize: 10, lineHeight: 1.2 }}>{outdoorPts.length ? Number(p.intensity) || 0 : p.node_name?.split(' ').slice(-2).join(' ')}</b>
                </span>
              );
            })}
          </div>
          <div className="heatLegend"><span>Low</span><i /><span>High</span></div>
        </>
      )}
    </article>
  );
}

export function SessionsPanel({ scope = 'inside' }) {
  if (scope !== 'inside') return <OutdoorNavigationPanel />;
  const { data, loading, error, reload } = useFetch(() => api.getSessions(tok(), 'inside'), [scope]);
  const { data: dashboardData } = useFetch(() => api.getDashboard(tok()));
  const sessions = data?.sessions || [];
  const floorData = dashboardData?.floorData || {};

  const total     = sessions.length;
  const completed = sessions.filter(s => s.status === 'completed').length;
  const canceled  = sessions.filter(s => s.status === 'canceled').length;
  const started   = sessions.filter(s => s.status === 'started').length;
  const kpis = [
    ['Total Sessions', total],
    ['Completed', completed],
    ['In Progress', started],
    ['Canceled', canceled],
    ['AR Anchors', floorData.anchors],
    ['Floor POIs', floorData.destinations],
    ['Completion', total > 0 ? `${Math.round((completed / total) * 100)}%` : null],
  ];

  if (loading) return <article className="actualPanel"><Spin /></article>;
  if (error) return <article className="actualPanel"><Err msg={error} reload={reload} /></article>;

  return (
    <div className="actualPage">
      <div className="actualMetricGrid">
        {kpis.map(([label, value]) => (
          <article className="actualMetric" key={label}>
            <small>{label}</small>
            <strong>{value ?? '-'}</strong>
          </article>
        ))}
      </div>

      <article className="actualPanel">
        <PHead title="Inside Navigation Sessions" count={sessions.length} action={<span style={{ color: '#64748b', fontSize: 12 }}>INSIDE</span>} />
        <p style={{ margin: '-8px 20px 16px', color: '#64748b', fontSize: 13 }}>
          Indoor movement from QR anchors through rooms, floors, facilities, and POIs.
        </p>
        {sessions.length === 0 ? <Empty /> : (
          <TTable
            heads={['AR ID', 'Destination', 'Status', 'Visited Nodes', 'Session ID', 'Created']}
            rows={sessions}
            renderRow={s => (<>
              <TD mono><b>{s.ar_id || s.qr_id || s.ar_marker_name || '–'}</b></TD>
              <TD muted>{(s.destination_name || '–').slice(0, 32)}</TD>
              <TD><Pill v={s.status === 'completed' ? 'Successful' : s.status === 'canceled' ? 'Failed' : s.status || '–'} /></TD>
              <TD center>{Array.isArray(s.visited_node_ids) ? s.visited_node_ids.length : 0}</TD>
              <TD mono muted>{s.session_id || `DB-${s.id}`}</TD>
              <TD muted>{s.client_created_at ? new Date(s.client_created_at).toLocaleString() : '–'}</TD>
            </>)}
          />
        )}
      </article>
    </div>
  );
}

export function SyncPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getSyncs(tok()));
  const syncs = data?.syncs || [];
  return (
    <article className="actualPanel">
      <PHead title="Device Sync Log" count={syncs.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : syncs.length === 0 ? <Empty /> : (
        <TTable
          heads={['Scope', 'Last Sync', 'Total Sessions', 'Completed']}
          rows={syncs}
          renderRow={s => (<>
            <TD><b>{s.session_scope || '-'}</b></TD>
            <TD muted>{s.last_sync_time ? new Date(s.last_sync_time).toLocaleString() : '–'}</TD>
            <TD center>{s.session_count}</TD>
            <TD center><Pill v={`${s.successful_count} ok`} /></TD>
          </>)}
        />
      )}
    </article>
  );
}

function OutdoorNavigationPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getOutdoorAnalytics(tok()));
  const stats = data?.stats || {};
  const recent = Array.isArray(data?.recent) ? data.recent : [];
  const destinations = Array.isArray(data?.destinations) ? data.destinations : [];
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  const searches = Array.isArray(data?.searches) ? data.searches : [];
  const heatmap = Array.isArray(data?.heatmap) ? data.heatmap : [];
  const kpis = [
    ['Total Sessions', stats.total],
    ['Completed', stats.completed],
    ['Today', stats.today],
    ['GPS Positions', stats.positions],
    ['Searches', stats.searches],
    ['Completion', stats.completion != null ? `${stats.completion}%` : null]
  ];

  if (loading) return <article className="actualPanel"><Spin /></article>;
  if (error) {
    return (
      <article className="actualPanel">
        <PHead title="Outside Navigation" action={<span>Outdoor API</span>} />
        <Err msg={error} reload={reload} />
        <p style={{ margin: '0 20px 20px', color: '#64748b', fontSize: 13 }}>
          The outdoor API should be available at <code>https://naviagtion-2.onrender.com</code>.
        </p>
      </article>
    );
  }

  return (
    <div className="actualPage">
      <div className="actualMetricGrid">
        {kpis.map(([label, value]) => (
          <article className="actualMetric" key={label}>
            <small>{label}</small>
            <strong>{value ?? '-'}</strong>
          </article>
        ))}
      </div>

      <article className="actualPanel">
        <PHead title="Recent Outdoor Sessions" count={recent.length} action={<span>{heatmap.length} heat points</span>} />
        {recent.length === 0 ? <Empty /> : (
          <TTable
            heads={['From', 'To', 'Route Length', 'Status', 'Started', 'Completed']}
            rows={recent}
            renderRow={session => (
              <>
                <TD><b>{session.from_name || '-'}</b></TD>
                <TD muted>{session.to_name || '-'}</TD>
                <TD>{session.route_length ? `${Math.round(session.route_length)}m` : '-'}</TD>
                <TD><Pill v={Number(session.completed) === 1 || session.completed === true ? 'Successful' : 'Failed'} /></TD>
                <TD muted>{session.started_at || '-'}</TD>
                <TD muted>{session.completed_at || '-'}</TD>
              </>
            )}
          />
        )}
      </article>

      <div className="actualGrid">
        <article className="actualPanel">
          <PHead title="Top Destinations" count={destinations.length} />
          {destinations.length === 0 ? <Empty /> : (
            <div className="actualTable">
              {destinations.slice(0, 8).map(destination => (
                <div key={destination.id || destination.name}>
                  <b>{destination.name}</b>
                  <span>{destination.id || '-'}</span>
                  <Pill v={`${destination.visits || 0} visits`} />
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="actualPanel">
          <PHead title="Top Searches" count={searches.length} />
          {searches.length === 0 ? <Empty /> : (
            <div className="actualTable">
              {searches.slice(0, 8).map(search => (
                <div key={search.name}>
                  <b>{search.name}</b>
                  <span>{search.count || 0} searches</span>
                  <Pill v="Active" />
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <article className="actualPanel">
        <PHead title="Top Outdoor Routes" count={routes.length} />
        {routes.length === 0 ? <Empty /> : (
          <TTable
            heads={['Start', 'Destination', 'Count']}
            rows={routes}
            renderRow={route => (
              <>
                <TD><b>{route.fromName || '-'}</b></TD>
                <TD muted>{route.toName || '-'}</TD>
                <TD center>{route.count || 0}</TD>
              </>
            )}
          />
        )}
      </article>
    </div>
  );
}
