'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Pill, PHead, Empty, Spin, Err, Btn, Input, Sel, FGrid, TTable, TD, MsgBox } from './shared';

export function PoiDirectoryPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getNodes(tok()));
  const { data: outdoorNodesData, loading: outdoorLoading, error: outdoorError } = useFetch(() => api.getOutdoorNodes(tok()));
  const [nodes, setNodes] = useState([]);
  useEffect(() => { if (data?.nodes) setNodes(data.nodes); }, [data]);
  const outdoorNodes = Array.isArray(outdoorNodesData) ? outdoorNodesData : (outdoorNodesData?.nodes || []);
  const rows = [
    ...nodes.map(node => ({ ...node, source: 'Inside', display_name: node.node_name, detail: node.floor_label || '-', editable: true })),
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

  async function toggle(id, field, current) {
    try {
      const res = await api.patchPoiVisibility(tok(), id, { [field]: !current });
      setNodes(ns => ns.map(n => n.id === id ? { ...n, ...res.node } : n));
    } catch (err) { alert(err.message); }
  }

  return (
    <article className="actualPanel">
      <PHead title="POI Directory" count={rows.length} />
      {loading || outdoorLoading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : rows.length === 0 ? <Empty /> : (
        <TTable
          heads={['Name', 'Source', 'Type', 'Detail', 'Published', 'Staff Only']}
          rows={rows}
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
    } catch (err) { alert(err.message); }
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
                {n.is_published ? '✅' : '⬜'}
              </button>
            </TD>
            <TD center>
              <button onClick={() => toggle(n.id, 'is_staff_only', n.is_staff_only)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, lineHeight: 1 }} title="Toggle Staff Only">
                {n.is_staff_only ? '🔒' : '🔓'}
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
        <div><Btn type="submit" size="md" disabled={saving}>{saving ? 'Saving…' : 'Add Category'}</Btn></div>
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

  return (
    <div className="actualPage">
    <article className="actualPanel">
      <PHead title="Blocks & Buildings" count={buildings.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : null}
      <div className="actualTable" style={{ margin: '0 20px 16px' }}>
        {buildings.length === 0 && !loading ? <Empty /> : buildings.map(b => (
          <div key={b.id}><b>{b.name}</b><span>{b.description}</span><Pill v="Active" /></div>
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
            <TD center>{n.is_published ? '✅' : '⬜'}</TD>
            <TD center>{n.is_staff_only ? '🔒' : '–'}</TD>
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
