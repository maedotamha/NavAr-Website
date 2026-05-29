'use client';
import { useEffect, useRef, useState } from 'react';

// ── Global toast system ───────────────────────────────────────────────────────
const _toastListeners = [];

export function toast(msg, type = 'error') {
  const id = Date.now() + Math.random();
  _toastListeners.forEach(fn => fn({ id, msg: String(msg || 'An error occurred.'), type }));
}

export function ToastContainer() {
  const [items, setItems] = useState([]);
  const timers = useRef({});

  useEffect(() => {
    function handler(t) {
      setItems(prev => [...prev.slice(-4), t]);          // keep max 5
      timers.current[t.id] = setTimeout(() => dismiss(t.id), 5000);
    }
    _toastListeners.push(handler);
    return () => {
      const i = _toastListeners.indexOf(handler);
      if (i > -1) _toastListeners.splice(i, 1);
    };
  }, []);

  function dismiss(id) {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setItems(prev => prev.filter(x => x.id !== id));
  }

  if (items.length === 0) return null;

  const styles = {
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '⚠' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✓' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: 'ℹ' },
  };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'grid', gap: 8, width: 360, pointerEvents: 'none' }}>
      {items.map(t => {
        const s = styles[t.type] || styles.error;
        const isPermission = t.msg.includes('Missing permission') || t.msg.includes('permission') || t.msg.includes('403');
        return (
          <div key={t.id} style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 10, padding: '13px 16px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(15,23,42,0.14)', display: 'grid', gap: 4, pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>{s.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.5 }}>{t.msg}</span>
              <button onClick={() => dismiss(t.id)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.55, fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
            </div>
            {isPermission && (
              <div style={{ marginTop: 4, paddingLeft: 26, fontSize: 12, opacity: 0.85 }}>
                Sign out and back in to refresh your session permissions.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function tok() {
  return typeof window !== 'undefined' ? localStorage.getItem('navarAdminToken') || '' : '';
}

export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  function load() {
    setLoading(true); setError('');
    fetcher().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, deps); // eslint-disable-line
  return { data, loading, error, reload: load };
}

export function Pill({ v }) {
  const map = {
    open: ['#fef9c3','#92400e'], resolved: ['#dcfce7','#15803d'], active: ['#dbeafe','#1d4ed8'],
    successful: ['#dcfce7','#15803d'], failed: ['#fee2e2','#b91c1c'], inactive: ['#f1f5f9','#475569'],
    published: ['#dcfce7','#15803d'], hidden: ['#f1f5f9','#475569'], popular: ['#ede9fe','#6d5dfc'],
    lab: ['#dbeafe','#1d4ed8'], office: ['#ede9fe','#6d5dfc'], service: ['#f0fdf4','#15803d'],
    entrance: ['#ffedd5','#c2410c'], lobby: ['#fef9c3','#92400e'], corridor: ['#f1f5f9','#475569'],
    stairs: ['#fee2e2','#b91c1c'], elevator: ['#dbeafe','#1d4ed8'],
  };
  const s = String(v || '').toLowerCase();
  const [bg, color] = map[s] || ['#f1f5f9', '#475569'];
  return <span style={{ borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 800, background: bg, color, whiteSpace: 'nowrap' }}>{v}</span>;
}

export function PHead({ title, count, action }) {
  return (
    <div className="actualPanelHead">
      <h3 style={{ margin: 0, fontSize: 15 }}>
        {title}
        {count != null && <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({count})</span>}
      </h3>
      {action}
    </div>
  );
}

export function Empty({ msg = 'No records found' }) {
  return <div style={{ padding: '28px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{msg}</div>;
}

export function Spin() {
  return <div style={{ padding: '28px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>;
}

export function Err({ msg, reload }) {
  return (
    <div style={{ padding: '16px', color: '#b91c1c', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
      {msg}
      <button onClick={reload} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Retry</button>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'sm', type = 'button', disabled }) {
  const styles = {
    primary: { background: '#6d5dfc', color: '#fff', border: '1px solid transparent' },
    danger: { background: '#ef4444', color: '#fff', border: '1px solid transparent' },
    ghost: { background: 'transparent', color: '#6d5dfc', border: '1px solid #6d5dfc' },
    secondary: { background: '#f1f5f9', color: '#334155', border: '1px solid #e5e7eb' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...styles[variant], borderRadius: 7, fontWeight: 700, padding: size === 'sm' ? '6px 12px' : '9px 18px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, opacity: disabled ? 0.65 : 1, whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

export function Input({ label, id, textarea, ...props }) {
  const s = { border: '1px solid #cbd5e1', borderRadius: 7, padding: '0 10px', fontFamily: 'inherit', fontSize: 13 };
  return (
    <label style={{ display: 'grid', gap: 5, fontSize: 13, fontWeight: 700, color: '#334155' }}>
      {label}
      {textarea
        ? <textarea id={id} style={{ ...s, padding: '8px 10px', minHeight: 72, resize: 'vertical' }} {...props} />
        : <input id={id} style={{ ...s, height: 38 }} {...props} />}
    </label>
  );
}

export function Sel({ label, id, children, ...props }) {
  return (
    <label style={{ display: 'grid', gap: 5, fontSize: 13, fontWeight: 700, color: '#334155' }}>
      {label}
      <select id={id} style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 7, padding: '0 10px', fontFamily: 'inherit', fontSize: 13 }} {...props}>
        {children}
      </select>
    </label>
  );
}

export function FGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12, marginBottom: 14 }}>{children}</div>;
}

export function TTable({ heads, rows, renderRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {heads.map(h => <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{rows.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>{renderRow(row)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function TD({ children, mono, muted, center }) {
  return <td style={{ padding: '10px 14px', color: muted ? '#64748b' : undefined, fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? 12 : undefined, textAlign: center ? 'center' : undefined }}>{children}</td>;
}

export function MsgBox({ msg }) {
  if (!msg) return null;
  const ok = !msg.startsWith('Error');
  return <div style={{ padding: '10px 14px', borderRadius: 7, background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#15803d' : '#b91c1c', fontSize: 13 }}>{msg}</div>;
}

export function ConfirmDialog({ open, title = 'Confirm action', message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="confirmOverlay" role="presentation">
      <section aria-modal="true" className="confirmDialog" role="dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div>
          <Btn variant="secondary" size="md" onClick={onCancel} disabled={busy}>{cancelLabel}</Btn>
          <Btn variant="danger" size="md" onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</Btn>
        </div>
      </section>
    </div>
  );
}
