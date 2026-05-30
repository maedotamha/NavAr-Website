'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Btn, MsgBox, Spin, Err } from './shared';

// What each setting category contains, with human descriptions for every field
const SETTINGS_CONFIG = {
  organization: {
    title: 'Organization Settings',
    description: 'Basic identity shown across the admin panel and in the mobile app.',
    sections: [
      {
        heading: 'Campus Identity',
        fields: [
          {
            key: 'organization_name',
            label: 'Organization Name',
            help: 'Full official name of your institution — shown in admin headers and reports.',
            placeholder: 'e.g. Addis Ababa Science and Technology University',
          },
          {
            key: 'campus_label',
            label: 'Campus Short Label',
            help: 'Abbreviated name displayed in the mobile app navigation bar.',
            placeholder: 'e.g. AASTU RTC',
          },
        ],
      },
      {
        heading: 'Contact & Locale',
        fields: [
          {
            key: 'support_contact',
            label: 'Support Contact',
            help: 'Email or phone number mobile users see when they tap "Get Help".',
            placeholder: 'e.g. support@aastu.edu.et',
          },
          {
            key: 'timezone',
            label: 'Timezone',
            help: 'All timestamps across the platform are interpreted in this timezone.',
            placeholder: 'e.g. Africa/Addis_Ababa',
          },
        ],
      },
    ],
  },
  sessions: {
    title: 'Session Rules',
    description: 'Controls how navigation sessions are tracked, synced, and stored on the server.',
    sections: [
      {
        heading: 'Timing',
        fields: [
          {
            key: 'session_timeout',
            label: 'Session Timeout',
            type: 'number',
            unit: 'minutes',
            help: 'A session with no activity for this long is automatically marked as ended.',
            placeholder: '30',
          },
          {
            key: 'sync_interval',
            label: 'Device Sync Interval',
            type: 'number',
            unit: 'seconds',
            help: 'How often the mobile app sends its buffered session data to the server.',
            placeholder: '60',
          },
        ],
      },
      {
        heading: 'Data Retention',
        fields: [
          {
            key: 'retention_period',
            label: 'Retention Period',
            type: 'number',
            unit: 'days',
            help: 'Session records older than this are purged from the database automatically.',
            placeholder: '90',
          },
          {
            key: 'anonymous_id_policy',
            label: 'Anonymous ID Policy',
            help: '"rotating" — generates a new ID each session for better privacy. "persistent" — reuses the same ID so you can track returning users.',
            placeholder: 'rotating',
          },
        ],
      },
    ],
  },
  security: {
    title: 'Security & Authentication',
    description: 'Manages admin token lifetimes, password requirements, and API access rules.',
    sections: [
      {
        heading: 'Authentication',
        fields: [
          {
            key: 'token_ttl',
            label: 'Token Lifetime',
            type: 'number',
            unit: 'minutes',
            help: 'Admin sessions expire after this many minutes of inactivity. Default is 480 (8 hours). Shorter values are more secure.',
            placeholder: '480',
          },
          {
            key: 'password_rules',
            label: 'Password Rules',
            help: 'Comma-separated constraints applied when creating or resetting passwords. Example: "min_length:8,require_uppercase,require_special".',
            placeholder: 'min_length:8',
          },
        ],
      },
      {
        heading: 'User Lifecycle',
        fields: [
          {
            key: 'inactive_user_handling',
            label: 'Inactive User Handling',
            help: 'What happens to admin accounts with no login in 90+ days. "disable" locks the account; "notify" sends an alert email.',
            placeholder: 'disable',
          },
        ],
      },
    ],
  },
};

export function SettingsPanel({ category }) {
  const cfg = SETTINGS_CONFIG[category] || { title: 'Settings', description: '', sections: [] };
  const { data, loading, error, reload } = useFetch(() => api.getSettingsByCategory(tok(), category), [category]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  async function save(e) {
    e.preventDefault(); setSaving(true); setMsg(''); setSaved(false);
    try {
      await api.updateSettingsByCategory(tok(), category, form);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  function toggleEdit() {
    if (editing && data?.settings) setForm(data.settings);
    setEditing(value => !value);
  }

  return (
    <article className="actualPanel">
      <div className="actualPanelHead">
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{cfg.title}</h3>
          {cfg.description && (
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{cfg.description}</p>
          )}
        </div>
        <Btn variant={editing ? 'secondary' : 'primary'} onClick={toggleEdit}>
          {editing ? 'Cancel Edit' : 'Edit'}
        </Btn>
      </div>

      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : (
        <form onSubmit={save} style={{ padding: '0 20px 24px', display: 'grid', gap: 28 }}>

          {cfg.sections.map(section => (
            <div key={section.heading}>
              {/* Section divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6d5dfc', whiteSpace: 'nowrap' }}>
                  {section.heading}
                </span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gap: 18 }}>
                {section.fields.map(f => (
                  <div key={f.key} style={{ display: 'grid', gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {f.label}
                      {f.unit && (
                        <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: 12 }}>({f.unit})</span>
                      )}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={form[f.key] ?? ''}
                      placeholder={f.placeholder || ''}
                      disabled={!editing || saving}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value
                      }))}
                      style={{
                        height: 40, border: '1px solid #cbd5e1', borderRadius: 8,
                        padding: '0 12px', fontFamily: 'inherit', fontSize: 13,
                        color: '#0f172a', background: editing ? '#fff' : '#f8fafc',
                        transition: 'border-color .15s',
                      }}
                    />
                    {f.help && (
                      <small style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.55 }}>{f.help}</small>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Allowed CORS origins — security only */}
          {category === 'security' && Array.isArray(form.allowed_origins) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6d5dfc', whiteSpace: 'nowrap' }}>API Origins</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Allowed CORS Origins</label>
                <textarea
                  value={form.allowed_origins.join('\n')}
                  disabled={!editing || saving}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    allowed_origins: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{
                    width: '100%', minHeight: 96, border: '1px solid #cbd5e1', borderRadius: 8,
                    padding: '10px 12px', fontFamily: 'monospace', fontSize: 12,
                    resize: 'vertical', boxSizing: 'border-box', color: '#0f172a',
                    background: editing ? '#fff' : '#f8fafc',
                  }}
                />
                <small style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.55 }}>
                  One origin per line. These domains may call the NavAR API. Typically your admin panel URL and the mobile app origin.
                </small>
              </div>
            </div>
          )}

          {/* Save bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <Btn type="submit" size="md" disabled={!editing || saving}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
            {saved && (
              <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                Saved successfully
              </span>
            )}
            {msg && <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 700 }}>{msg}</span>}
          </div>
        </form>
      )}
    </article>
  );
}
