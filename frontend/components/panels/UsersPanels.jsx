'use client';
import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { tok, useFetch, Pill, PHead, Empty, Spin, Err, Btn, Input, Sel, FGrid, TTable, TD, MsgBox, ConfirmDialog } from './shared';

// Modules that are purely internal/infrastructure — hide from permission UI
const HIDDEN_MODULE_KEYS = ['routes', 'navigation', 'outdoor_navigation', 'maps', 'qr_anchors', 'analytics', 'pathfinding'];
const visibleModules = (modules) =>
  (modules || []).filter(m => !HIDDEN_MODULE_KEYS.includes(m.key) && !HIDDEN_MODULE_KEYS.includes(m.module_key));

export function UsersPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getAccessControl(tok()));
  const users = data?.users || [];
  const roles = data?.roles || [];
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', password: '', role_id: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);

  const set = (key, value) => setForm(c => ({ ...c, [key]: value }));
  const setEdit = (key, value) => setEditForm(c => ({ ...c, [key]: value }));

  function openModal() {
    setForm({ full_name: '', email: '', password: '', role_id: '' });
    setMsg(''); setShowModal(true);
  }
  function closeModal() { setShowModal(false); setMsg(''); }

  async function create(event) {
    event.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.createUser(tok(), { ...form, roleId: Number(form.role_id) });
      setMsg('User created.');
      reload();
      setTimeout(() => closeModal(), 1100);
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  function beginEdit(user) {
    setMsg(''); setEditingId(user.id);
    setEditForm({ full_name: user.full_name || '', email: user.email || '', password: '', role_id: user.role_id ? String(user.role_id) : '', is_active: user.is_active !== false });
  }

  async function saveEdit(event) {
    event.preventDefault(); if (!editingId) return;
    setSaving(true); setMsg('');
    const body = { full_name: editForm.full_name, email: editForm.email, roleId: Number(editForm.role_id), is_active: editForm.is_active };
    if (editForm.password) body.password = editForm.password;
    try {
      await api.updateUser(tok(), editingId, body);
      setMsg('User updated.'); setEditingId(null); reload();
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  async function assignRole(userId, roleId) {
    try { await api.assignUserRole(tok(), userId, Number(roleId)); reload(); }
    catch (err) { alert(err.message); }
  }

  async function remove(id) {
    setSaving(true);
    try { await api.deleteUser(tok(), id); setConfirm(null); reload(); }
    catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  return (
    <>
      {/* Create User Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.48)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <article style={{ width: 'min(540px,100%)', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 24px 70px rgba(15,23,42,0.22)', padding: 28, display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Create New User</h3>
              <button onClick={closeModal} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 24, color: '#94a3b8', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <form onSubmit={create} style={{ display: 'grid', gap: 14 }}>
              <FGrid>
                <Input label="Full Name *" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
                <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                <Input label="Password *" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
                <Sel label="Role *" value={form.role_id} onChange={e => set('role_id', e.target.value)} required>
                  <option value="">Select role…</option>
                  {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </Sel>
              </FGrid>
              <MsgBox msg={msg} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn variant="secondary" size="md" onClick={closeModal} type="button">Cancel</Btn>
                <Btn type="submit" size="md" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</Btn>
              </div>
            </form>
          </article>
        </div>
      )}

      <article className="actualPanel">
        <PHead title="Admin Users" count={users.length} action={<Btn onClick={openModal}>+ Add User</Btn>} />
        {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : users.length === 0 ? <Empty /> : (
          <TTable
            heads={['Name', 'Email', 'Assigned Role', 'Status', 'Actions']}
            rows={users}
            renderRow={user => (
              <>
                <TD><b>{user.full_name}</b></TD>
                <TD muted>{user.email}</TD>
                <TD>
                  <select
                    aria-label={`Assign role to ${user.full_name}`}
                    onChange={event => assignRole(user.id, event.target.value)}
                    style={{ height: 34, border: '1px solid #cbd5e1', borderRadius: 7, padding: '0 9px', font: 'inherit', fontSize: 13, minWidth: 150 }}
                    value={user.role_id || ''}
                  >
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </TD>
                <TD><Pill v={user.is_active !== false ? 'Active' : 'Inactive'} /></TD>
                <TD>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="secondary" onClick={() => beginEdit(user)}>Edit</Btn>
                    <Btn variant="danger" onClick={() => setConfirm({ type: 'user', id: user.id, name: user.full_name || user.email })}>Delete</Btn>
                  </div>
                </TD>
              </>
            )}
          />
        )}
        {editingId && (
          <form onSubmit={saveEdit} style={{ padding: '16px 20px 20px', borderTop: '1px solid #f1f5f9', display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#334155' }}>Edit User</p>
            <FGrid>
              <Input label="Full Name *" value={editForm.full_name} onChange={e => setEdit('full_name', e.target.value)} required />
              <Input label="Email *" type="email" value={editForm.email} onChange={e => setEdit('email', e.target.value)} required />
              <Input label="New Password" type="password" value={editForm.password} onChange={e => setEdit('password', e.target.value)} placeholder="Leave blank to keep" />
              <Sel label="Role *" value={editForm.role_id} onChange={e => setEdit('role_id', e.target.value)} required>
                <option value="">Select role…</option>
                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
              </Sel>
            </FGrid>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>
              <input type="checkbox" checked={editForm.is_active} onChange={e => setEdit('is_active', e.target.checked)} />
              Active account
            </label>
            <MsgBox msg={msg} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn type="submit" size="md" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
              <Btn variant="secondary" size="md" onClick={() => setEditingId(null)} type="button">Cancel</Btn>
            </div>
          </form>
        )}
        <ConfirmDialog
          busy={saving}
          message={`Delete ${confirm?.name || 'this user'}? This cannot be undone.`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => remove(confirm.id)}
          open={confirm?.type === 'user'}
          title="Delete User"
        />
      </article>
    </>
  );
}

export function RolesPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getAccessControl(tok()));
  const roles = data?.roles || [];
  const modules = visibleModules(data?.modules);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);
  const selectedRole = roles.find(role => String(role.id) === String(selectedRoleId)) || roles[0];
  const selectedPermissions = selectedRole?.permissions || [];

  useEffect(() => {
    if (!selectedRoleId && roles[0]) setSelectedRoleId(String(roles[0].id));
  }, [roles, selectedRoleId]);

  async function create(event) {
    event.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.createRole(tok(), { ...form, key: form.name.toLowerCase().replace(/\s+/g, '_'), permissions: [] });
      setMsg('Role created.'); setForm({ name: '', description: '' }); reload();
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  async function remove(id) {
    setSaving(true);
    try { await api.deleteRole(tok(), id); setConfirm(null); reload(); }
    catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  async function togglePermission(permission, checked) {
    if (!selectedRole) return;
    const permissions = checked
      ? [...new Set([...selectedPermissions, permission])]
      : selectedPermissions.filter(item => item !== permission);
    try {
      await api.updateRole(tok(), selectedRole.id, { name: selectedRole.name, description: selectedRole.description || '', permissions });
      reload();
    } catch (err) { alert(err.message); }
  }

  return (
    <article className="actualPanel">
      <PHead title="Roles" count={roles.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : (
        <div className="actualTable" style={{ margin: '0 20px 16px' }}>
          {roles.length === 0 ? <Empty /> : roles.map(role => (
            <div key={role.id}>
              <b>{role.name}</b>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{role.key || role.role_key}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {role.is_system && <Pill v="System" />}
                {!role.is_system && <Btn variant="danger" onClick={() => setConfirm({ id: role.id, name: role.name })}>Delete</Btn>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRole && modules.length > 0 && (
        <section style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px 20px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#334155' }}>Assign Permissions to Role</p>
              <small style={{ color: '#64748b' }}>Choose a role, then toggle the module actions it can use.</small>
            </div>
            <Sel label="Role" value={selectedRoleId} onChange={event => setSelectedRoleId(event.target.value)}>
              {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
            </Sel>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {modules.map(module => (
              <div key={module.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <b style={{ fontSize: 14 }}>{module.name}</b>
                  <code style={{ fontSize: 11, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 6px', color: '#64748b' }}>{module.key || module.module_key}</code>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(module.actions || []).map(action => (
                    <label key={action.permission} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 999, padding: '6px 10px', cursor: 'pointer' }}>
                      <input
                        checked={selectedPermissions.includes(action.permission)}
                        onChange={event => togglePermission(action.permission, event.target.checked)}
                        type="checkbox"
                      />
                      {action.name || action.key}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={create} style={{ padding: '16px 20px 20px', borderTop: '1px solid #f1f5f9', display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#334155' }}>Create New Role</p>
        <FGrid>
          <Input label="Role Name *" value={form.name} onChange={event => setForm(c => ({ ...c, name: event.target.value }))} required />
          <Input label="Description" value={form.description} onChange={event => setForm(c => ({ ...c, description: event.target.value }))} />
        </FGrid>
        <MsgBox msg={msg} />
        <div><Btn type="submit" size="md" disabled={saving}>{saving ? 'Creating…' : 'Create Role'}</Btn></div>
      </form>

      <ConfirmDialog
        busy={saving}
        message={`Delete ${confirm?.name || 'this role'}? Assigned roles cannot be deleted.`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        open={Boolean(confirm)}
        title="Delete Role"
      />
    </article>
  );
}

export function PermissionsPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getAccessControl(tok()));
  const modules = visibleModules(data?.modules);
  return (
    <article className="actualPanel">
      <PHead title="Permission Modules" count={modules.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : modules.length === 0 ? <Empty /> : (
        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 10 }}>
          {modules.map(module => (
            <div key={module.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <b style={{ fontSize: 14 }}>{module.name}</b>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', background: '#f8fafc', padding: '2px 7px', borderRadius: 6 }}>{module.key || module.module_key}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(module.actions || []).map(action => <Pill key={action.key || action.permission} v={action.name || action.key} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export function AccessLogsPanel() {
  const { data, loading, error, reload } = useFetch(() => api.getAccessLogs(tok()));
  const logs = data?.logs || [];
  return (
    <article className="actualPanel">
      <PHead title="Access Audit Logs" count={logs.length} />
      {loading ? <Spin /> : error ? <Err msg={error} reload={reload} /> : logs.length === 0 ? <Empty /> : (
        <TTable
          heads={['Actor', 'Action', 'Target', 'Timestamp']}
          rows={logs}
          renderRow={log => (
            <>
              <TD><b>{log.actor}</b></TD>
              <TD muted>{log.action}</TD>
              <TD muted>{log.target}</TD>
              <TD muted>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</TD>
            </>
          )}
        />
      )}
    </article>
  );
}
