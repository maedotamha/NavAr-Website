'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Pill, PHead, Empty, Spin, Err, Btn, Input, Sel, FGrid, TTable, TD, MsgBox, toast } from './shared';

export function PoiDirectoryPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getNodes(tok()));
  const { data: poiData, loading: poiLoading } = useFetch(() => api.getPois(tok()));
  const { data: outdoorNodesData, loading: outdoorLoading, error: outdoorError } = useFetch(() => api.getOutdoorNodes(tok()));
  const [nodes, setNodes] = useState([]);
  useEffect(() => { if (data?.nodes) setNodes(data.nodes); }, [data]);
  const floorPois = poiData?.pois || [];
  const outdoorNodes = Array.isArray(outdoorNodesData) ? outdoorNodesData : (outdoorNodesData?.nodes || []);
  const nodeRows = [
    ...nodes.map(node => ({
      ...node,
      source: node.source === 'floor-data' ? 'Floor Data' : 'Inside',
      display_name: node.node_name,
      detail: node.source === 'floor-data'
        ? `${node.location_name || '-'} / ${node.qr_id || '-'}`
        : node.floor_label || '-',
      editable: node.source !== 'floor-data'
    })),
    ...outdoorNodes
      .filter(node => node.type !== 'junction')
      .map(node => ({
        id: `outdoor-${node.id}`,
        source: 'Outside',
        display_name: node.name,
        node_type: node.type,
        detail: node.notes || `${node.lat}, ${node.lng}`,
        is_published: true,
        is_staff_only: false,
        editable: false
      }))
  ];
  const poiRows = floorPois.map(poi => ({
    ...poi,
    display_name: poi.location_name || poi.poi_name,
    detail: (poi.entrance_node_ids || []).join(', ') || '-'
  }));

  async function toggle(id, field, current) {
    try {
      const res = await api.patchPoiVisibility(tok(), id, { [field]: !current });
      setNodes(ns => ns.map(n => n.id === id ? { ...n, ...res.node } : n));
    } catch (err) { toast(err.message); }
  }

  return (
    <div className="actualPage">
    <article className="actualPanel">
      <PHead title="Floor Points of Interest" count={poiRows.length} />
      {poiLoading ? <Spin /> : poiRows.length === 0 ? <Empty /> : (
        <TTable
          heads={['Location Name', 'Floor', 'Category', 'Entrance Nodes']}
          rows={poiRows}
          renderRow={poi => (<>
            <TD><b>{poi.display_name}</b></TD>
            <TD muted>{poi.floor_label}</TD>
            <TD><Pill v={poi.node_type || '-'} /></TD>
            <TD muted>{poi.detail}</TD>
          </>)}
        />
      )}
    </article>
    <article className="actualPanel">
      <PHead title="Nodes" count={nodeRows.length} />
      {loading || outdoorLoading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : nodeRows.length === 0 ? <Empty /> : (
        <TTable
          heads={['Node ID', 'Source', 'Type', 'Detail', 'Published', 'Staff Only']}
          rows={nodeRows}
          renderRow={n => (<>
            <TD><b style={{ maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.display_name}</b></TD>
            <TD><Pill v={n.source} /></TD>
            <TD><Pill v={n.node_type || '-' } /></TD>
            <TD muted>{String(n.detail || '-').slice(0, 48)}</TD>
            <TD center>{n.editable ? <button onClick={() => toggle(n.id, 'is_published', n.is_published)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}>{n.is_published ? 'Yes' : 'No'}</button> : 'Yes'}</TD>
            <TD center>{n.editable ? <button onClick={() => toggle(n.id, 'is_staff_only', n.is_staff_only)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}>{n.is_staff_only ? 'Yes' : 'No'}</button> : 'No'}</TD>
          </>)}
        />
      )}
      {outdoorError && <div style={{ padding: '0 20px 16px', color: '#b91c1c', fontSize: 13 }}>Outdoor POIs could not load: {outdoorError}</div>}
    </article>
    </div>
  );
}

function LegacyPoiDirectoryPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getNodes(tok()));
  const [nodes, setNodes] = useState([]);
  useEffect(() => { if (data?.nodes) setNodes(data.nodes); }, [data]);

  async function toggle(id, field, current) {
    try {
      const res = await api.patchPoiVisibility(tok(), id, { [field]: !current });
      setNodes(ns => ns.map(n => n.id === id ? { ...n, ...res.node } : n));
    } catch (err) { toast(err.message); }
  }

  return (
    <article className="actualPanel">
      <PHead title="POI Directory" count={nodes.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : nodes.length === 0 ? <Empty /> : (
        <TTable
          heads={['Name', 'Floor', 'Type', 'Published', 'Staff Only']}
          rows={nodes}
          renderRow={n => (<>
            <TD><b style={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.node_name}</b></TD>
            <TD muted>{n.floor_label || '–'}</TD>
            <TD><Pill v={n.node_type || '–'} /></TD>
            <TD center>
              <button onClick={() => toggle(n.id, 'is_published', n.is_published)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, lineHeight: 1 }} title="Toggle Published">
                {n.is_published ? 'Yes' : 'No'}
              </button>
            </TD>
            <TD center>
              <button onClick={() => toggle(n.id, 'is_staff_only', n.is_staff_only)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, lineHeight: 1 }} title="Toggle Staff Only">
                {n.is_staff_only ? 'Yes' : 'No'}
              </button>
            </TD>
          </>)}
        />
      )}
    </article>
  );
}

export function PoiCategoriesPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getPoiCategories(tok()));
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (data?.categories) setCats(data.categories); }, [data]);

  async function create(e) {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const res = await api.createPoiCategory(tok(), form);
      setCats(c => [...c, res.category]);
      setForm({ name: '', key: '', description: '' });
      setMsg('Category created.');
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  return (
    <article className="actualPanel">
      <PHead title="POI Categories" count={cats.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : null}
      <div className="actualTable" style={{ margin: '0 20px 16px' }}>
        {cats.map(c => (
          <div key={c.id}>
            <b>{c.name}</b>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.key}</span>
            <Pill v={c.is_published ? 'Published' : 'Hidden'} />
          </div>
        ))}
      </div>
      <form onSubmit={create} style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#334155' }}>Add New Category</p>
        <FGrid>
          <Input label="Category Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Key (slug) *" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} required placeholder="e.g. lab" />
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </FGrid>
        <MsgBox msg={msg} />
        <div><Btn type="submit" size="md" disabled={saving}>{saving ? 'Saving...' : 'Add Category'}</Btn></div>
      </form>
    </article>
  );
}

export function BlocksPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getBuildings(tok()));
  const { data: outdoorData, loading: outdoorLoading } = useFetch(() => api.getOutdoorAnalytics(tok()));
  const [buildings, setBuildings] = useState([]);
  useEffect(() => { if (data?.buildings) setBuildings(data.buildings); }, [data]);
  const destinations = Array.isArray(outdoorData?.destinations) ? outdoorData.destinations : [];
  async function changeStatus(id, status) {
    try {
      const res = await api.updateBuildingStatus(tok(), id, status);
      setBuildings(items => items.map(item => item.id === id ? { ...item, ...res.building } : item));
    } catch (err) { toast(err.message); }
  }

  return (
    <div className="actualPage">
    <article className="actualPanel">
      <PHead title="Blocks & Buildings" count={buildings.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : null}
      <div className="actualTable" style={{ margin: '0 20px 16px' }}>
        {buildings.length === 0 && !loading ? <Empty /> : buildings.map(b => (
          <div key={b.id}>
            <b>{b.name}</b>
            <span>{b.description}</span>
            <select
              aria-label={`Status for ${b.name}`}
              onChange={event => changeStatus(b.id, event.target.value)}
              style={{ height: 32, border: '1px solid #cbd5e1', borderRadius: 7, padding: '0 8px', font: 'inherit', fontSize: 12 }}
              value={b.status || 'active'}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        ))}
      </div>
    </article>
    <article className="actualPanel">
      <PHead title="Outdoor Destinations" count={destinations.length} action={<span>AASTU Navigator</span>} />
      {outdoorLoading ? <Spin /> : destinations.length === 0 ? <Empty /> : (
        <TTable
          heads={['Destination', 'Node ID', 'Visits']}
          rows={destinations}
          renderRow={destination => (<>
            <TD><b>{destination.name || '-'}</b></TD>
            <TD muted>{destination.id || '-'}</TD>
            <TD center>{destination.visits || 0}</TD>
          </>)}
        />
      )}
    </article>
    </div>
  );
}

export function RoomsPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getNodes(tok()));
  const nodes = data?.nodes || [];
  const [filter, setFilter] = useState('');
  const filtered = nodes.filter(n => !filter || n.node_type === filter);
  const types = [...new Set(nodes.map(n => n.node_type).filter(Boolean))];

  return (
    <article className="actualPanel">
      <PHead title="Rooms & Facilities" count={filtered.length} action={
        <Sel label="" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </Sel>
      } />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : filtered.length === 0 ? <Empty /> : (
        <TTable
          heads={['Room / Facility', 'Floor', 'Type', 'Published', 'Staff Only']}
          rows={filtered}
          renderRow={n => (<>
            <TD><b style={{ maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.node_name}</b></TD>
            <TD muted>{n.floor_label || '–'}</TD>
            <TD><Pill v={n.node_type || '–'} /></TD>
            <TD center>{n.is_published ? 'Yes' : 'No'}</TD>
            <TD center>{n.is_staff_only ? 'Yes' : 'No'}</TD>
          </>)}
        />
      )}
    </article>
  );
}

export function AccessibilityPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getAccessibility(tok()));
  const acc = data?.accessibility || {};
  return (
    <article className="actualPanel">
      <PHead title="Accessibility Overview" />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : (
        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
            {[
              ['Total Routes', acc.total_routes, '#3b82f6', '#dbeafe'],
              ['Accessible Routes', acc.accessible_routes, '#22c55e', '#dcfce7'],
              ['Accessibility %', acc.accessibility_percentage != null ? acc.accessibility_percentage + '%' : '–', '#6d5dfc', '#ede9fe'],
              ['Stair Nodes', acc.stair_nodes, '#f59e0b', '#ffedd5'],
            ].map(([label, val, color, bg]) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: 18 }}>
                <small style={{ color, fontSize: 12, fontWeight: 700 }}>{label}</small>
                <strong style={{ display: 'block', fontSize: 28, marginTop: 6, color }}>{val ?? '–'}</strong>
              </div>
            ))}
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Accessibility stats are calculated from routes marked <code style={{ background: '#e2e8f0', padding: '2px 5px', borderRadius: 4 }}>is_accessible = TRUE</code> in the route graph.
              Stair nodes are navigation nodes of type <code style={{ background: '#e2e8f0', padding: '2px 5px', borderRadius: 4 }}>stairs</code>.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
