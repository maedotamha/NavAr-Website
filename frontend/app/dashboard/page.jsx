'use client';
import { useEffect, useState } from 'react';
import { createAccessLog, getSidebar } from '../../lib/api';
import { ToastContainer } from '../../components/panels/shared';
import { OverviewPanel, HeatMapPanel, SessionsPanel, SyncPanel } from '../../components/panels/OverviewPanels';
import { QrRegistryPanel } from '../../components/panels/QrPanels';
import { PoiDirectoryPanel, BlocksPanel } from '../../components/panels/PoiLocationPanels';
import { UsersPanel, RolesPanel, PermissionsPanel, AccessLogsPanel } from '../../components/panels/UsersPanels';
import { FeedbackInboxPanel, RouteIssuesPanel } from '../../components/panels/FeedbackPanels';
import { SettingsPanel } from '../../components/panels/SettingsPanels';

const iconPaths = {
  LayoutDashboard: 'M4 5h7v6H4V5Zm9 0h7v4h-7V5ZM4 13h7v6H4v-6Zm9-2h7v8h-7v-8Z',
  Activity: 'M4 12h4l2-6 4 12 2-6h4',
  QrCode: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z',
  MapPin: 'M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  Building2: 'M5 21V4h10v17M3 21h18M9 8h2M9 12h2M9 16h2M15 10h4v11',
  Users: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6',
  Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  MessageSquare: 'M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z',
  Settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-2 .4l-.2.2h-4l-.2-.2a1.8 1.8 0 0 0-2-.4l-.2.1-2-3.4.1-.1a1.8 1.8 0 0 0 .4-2l-.1-.2-2-1.1v-3.4l2-1.1.1-.2a1.8 1.8 0 0 0-.4-2l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 2-.4l.2-.2h4l.2.2a1.8 1.8 0 0 0 2 .4l.2-.1 2 3.4-.1.1a1.8 1.8 0 0 0-.4 2l.1.2 2 1.1v3.4l-2 1.1-.1.2Z'
};

function Icon({ name }) {
  return <svg aria-hidden viewBox="0 0 24 24"><path d={iconPaths[name] || iconPaths.LayoutDashboard} /></svg>;
}

function flattenModules(modules) {
  return modules.flatMap(m => [m, ...(m.children || [])]);
}

const PAGE_TITLES = {
  dashboard: 'Dashboard Overview',
  'dashboard.overview': 'Overview',
  'dashboard.heat_map': 'Campus Heat Map',
  sessions: 'Sessions',
  'sessions.inside': 'Inside Navigation Sessions',
  'sessions.outside': 'Outside Navigation Sessions',
  qr_codes: 'QR Codes',
  'qr_codes.registry': 'QR Anchor Registry',
  points_of_interest: 'Points of Interest',
  'points_of_interest.list': 'POI Directory',
  locations: 'Locations',
  'locations.blocks': 'Blocks & Floors',
  users_roles: 'Users & Roles',
  'users_roles.users': 'Users',
  'users_roles.roles': 'Roles',
  'users_roles.permissions': 'Permissions',
  access_control: 'Access Control',
  'access_control.logs': 'Access Logs',
  feedback: 'Feedback',
  'feedback.inbox': 'Feedback Inbox',
  'feedback.route_issues': 'Route Issues & Ratings',
  settings: 'Settings',
  'settings.organization': 'Organization',
  'settings.session_rules': 'Session Rules',
  'settings.security': 'Security',
};

const PAGE_SUBTITLES = {
  'dashboard.overview': 'System-wide KPIs, traffic trends, and service health.',
  'dashboard.heat_map': 'Visual map of high-traffic campus locations and QR scan density.',
  'sessions.inside': 'Indoor route sessions that start from QR positioning and move through blocks, rooms, floors, and POIs.',
  'sessions.outside': 'Outdoor/campus route sessions that move users between blocks, entrances, parking, and exterior destinations.',
  'qr_codes.registry': 'All registered AR marker anchors and their linked navigation nodes.',
  'points_of_interest.list': 'Manage searchable destinations. Toggle published and staff-only flags.',
  'locations.blocks': 'Campus block and building records.',
  'users_roles.users': 'Create and manage admin and staff user accounts.',
  'users_roles.roles': 'Define what each admin role can access.',
  'users_roles.permissions': 'Module action permissions assigned across all roles.',
  'access_control.logs': 'Audit trail for privileged admin actions.',
  'feedback.inbox': 'General comments and messages submitted from the mobile app.',
  'feedback.route_issues': 'Route issue reports and navigation quality ratings.',
  'settings.organization': 'Campus identity settings shown across admin and mobile.',
  'settings.session_rules': 'Session timeout, sync interval, and data retention rules.',
  'settings.security': 'Token TTL, password policy, and allowed API origins.',
};

function ActiveContent({ pageKey }) {
  switch (pageKey) {
    case 'dashboard':
    case 'dashboard.overview':
      return <OverviewPanel />;
    case 'dashboard.heat_map':
      return <HeatMapPanel />;
    case 'sessions':
    case 'sessions.inside':
      return <SessionsPanel scope="inside" />;
    case 'sessions.outside':
      return <SessionsPanel scope="outside" />;
    case 'qr_codes':
    case 'qr_codes.registry':
      return <QrRegistryPanel />;
    case 'points_of_interest':
    case 'points_of_interest.list':
      return <PoiDirectoryPanel />;
    case 'locations':
    case 'locations.blocks':
      return <BlocksPanel />;
    case 'users_roles':
    case 'users_roles.users':
      return <UsersPanel />;
    case 'users_roles.roles':
      return <RolesPanel />;
    case 'users_roles.permissions':
      return <PermissionsPanel />;
    case 'access_control':
    case 'access_control.logs':
      return <AccessLogsPanel />;
    case 'feedback':
    case 'feedback.inbox':
      return <FeedbackInboxPanel />;
    case 'feedback.route_issues':
      return <RouteIssuesPanel />;
    case 'settings.organization':
      return <SettingsPanel category="organization" />;
    case 'settings.session_rules':
    case 'settings':
      return <SettingsPanel category="sessions" />;
    case 'settings.security':
      return <SettingsPanel category="security" />;
    default:
      return <OverviewPanel />;
  }
}

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [sidebar, setSidebar] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [openModule, setOpenModule] = useState('dashboard');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('navarAdminToken');
    if (!token) { window.location.href = '/login'; return; }
    getSidebar(token)
      .then(data => {
        setSidebar(data);
        const firstModule = data.modules?.[0];
        const first = firstModule?.key || 'dashboard';
        const firstPage = firstModule?.children?.[0]?.key || first;
        setActiveModule(first); setActivePage(firstPage); setOpenModule(first);
        setReady(true);
      })
      .catch(err => { setError(err.message); setReady(true); });
  }, []);

  useEffect(() => {
    if (!ready || !activePage) return;
    const token = localStorage.getItem('navarAdminToken');
    if (!token) return;
    const title = PAGE_TITLES[activePage] || activePage;
    createAccessLog(token, { action: 'Visited Page', target: title }).catch(() => {});
  }, [ready, activePage]);

  if (!ready) return <main className="loadingPage">Loading NavAR dashboard…</main>;
  if (error) return <main className="loadingPage">Could not load sidebar: {error}</main>;

  const modules = sidebar?.modules || [];
  const active = modules.find(m => m.key === activeModule) || modules[0];
  const activeItem = flattenModules(modules).find(m => m.key === activePage) || active;
  const title = PAGE_TITLES[activePage] || activeItem?.label || 'Dashboard';
  const subtitle = PAGE_SUBTITLES[activePage] || 'NavAR admin workspace';

  return (
    <main className={collapsed ? 'adminShell sidebarCollapsed' : 'adminShell'}>
      <ToastContainer />
      <aside className="adminSidebar" aria-label="Admin modules">
        <div className="adminSidebarBrand">
          <div>
            <strong>NavAR</strong>
            <span>{sidebar?.role || 'Admin'} workspace</span>
          </div>
          <button aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} className="adminMenuToggle" onClick={() => setCollapsed(v => !v)} type="button">
            <Icon name="LayoutDashboard" />
          </button>
        </div>
        <nav className="adminSidebarNav">
          {modules.map(module => {
            const hasChildren = (module.children || []).length > 0;
            const isOpen = openModule === module.key && hasChildren && !collapsed;
            const isActiveModule = module.key === activeModule;
            return (
              <div className={isOpen ? 'adminMenuGroup open' : 'adminMenuGroup'} key={module.key}>
                <button
                  className={isActiveModule ? 'adminSidebarItem active' : 'adminSidebarItem'}
                  onClick={() => {
                    const firstChild = module.children?.[0]?.key;
                    setActiveModule(module.key);
                    setActivePage(firstChild || module.key);
                    setOpenModule(hasChildren ? module.key : '');
                  }}
                  title={collapsed ? module.label : undefined}
                  type="button"
                >
                  <span><Icon name={module.icon} /></span>
                  <b>{module.label}</b>
                  {hasChildren ? <i>{isOpen ? '-' : '+'}</i> : null}
                </button>
                {isOpen && (
                  <div className="adminNestedMenu">
                    {module.children.map(child => (
                      <button
                        className={child.key === activePage ? 'active' : ''}
                        key={child.key}
                        onClick={() => {
                          setActiveModule(module.key);
                          setActivePage(child.key);
                          setOpenModule(module.key);
                        }}
                        type="button"
                      >
                        <b>{child.label}</b>
                        <small>{child.sessionScope}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <section className="adminWorkspace">
        <header className="adminWorkspaceHeader">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <button
            className="adminLogout"
            onClick={() => {
              localStorage.removeItem('navarAdminToken');
              window.location.href = '/login';
            }}
            type="button"
          >
            Sign out
          </button>
        </header>
        <div className="adminContentGrid">
          <section style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <ActiveContent pageKey={activePage} />
          </section>
        </div>
      </section>
    </main>
  );
}
