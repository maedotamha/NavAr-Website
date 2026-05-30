const MENU = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    sessionScope: 'both',
    permissions: ['dashboard.read'],
    children: [
      { key: 'dashboard.overview', label: 'Overview', path: '/dashboard', sessionScope: 'both', permissions: ['dashboard.read'] },
      { key: 'dashboard.heat_map', label: 'Heat Map', path: '/dashboard?panel=heat-map', sessionScope: 'both', permissions: ['dashboard.read'] }
    ]
  },
  {
    key: 'sessions',
    label: 'Sessions',
    path: '/dashboard/sessions',
    icon: 'Activity',
    sessionScope: 'both',
    permissions: ['dashboard.read', 'routes.read'],
    children: [
      { key: 'sessions.inside', label: 'Inside Navigation', path: '/dashboard/sessions/inside', sessionScope: 'inside-session', permissions: ['dashboard.read', 'routes.read'] },
      { key: 'sessions.outside', label: 'Outside Navigation', path: '/dashboard/sessions/outside', sessionScope: 'outside-session', permissions: ['dashboard.read', 'routes.read'] }
    ]
  },
  {
    key: 'qr_codes',
    label: 'QR Codes',
    path: '/dashboard/qr-codes',
    icon: 'QrCode',
    sessionScope: 'both',
    permissions: ['qr_anchors.read'],
    children: [
      { key: 'qr_codes.registry', label: 'QR Registry', path: '/dashboard/qr-codes', sessionScope: 'outside-session', permissions: ['qr_anchors.read'] }
    ]
  },
  {
    key: 'points_of_interest',
    label: 'Points of Interest',
    path: '/dashboard/points-of-interest',
    icon: 'MapPin',
    sessionScope: 'both',
    permissions: ['facilities.read', 'maps.read'],
    children: [
      { key: 'points_of_interest.list', label: 'POI Directory', path: '/dashboard/points-of-interest', sessionScope: 'both', permissions: ['facilities.read'] }
    ]
  },
  {
    key: 'locations',
    label: 'Locations',
    path: '/dashboard/locations',
    icon: 'Building2',
    sessionScope: 'both',
    permissions: ['facilities.read'],
    children: [
      { key: 'locations.blocks', label: 'Blocks & Floors', path: '/dashboard/locations/blocks', sessionScope: 'outside-session', permissions: ['facilities.read'] }
    ]
  },
  {
    key: 'users_roles',
    label: 'Users & Roles',
    path: '/dashboard/users-roles',
    icon: 'Users',
    sessionScope: 'outside-session',
    permissions: ['access_control.read'],
    children: [
      { key: 'users_roles.users', label: 'Users', path: '/dashboard/users-roles/users', sessionScope: 'outside-session', permissions: ['access_control.read'] },
      { key: 'users_roles.roles', label: 'Roles', path: '/dashboard/users-roles/roles', sessionScope: 'outside-session', permissions: ['access_control.read'] },
      { key: 'users_roles.permissions', label: 'Permissions', path: '/dashboard/users-roles/permissions', sessionScope: 'outside-session', permissions: ['access_control.read'] }
    ]
  },
  {
    key: 'access_control',
    label: 'Access Control',
    path: '/dashboard/access-control',
    icon: 'Shield',
    sessionScope: 'outside-session',
    permissions: ['access_control.read'],
    children: [
      { key: 'access_control.logs', label: 'Access Logs', path: '/dashboard/access-control/logs', sessionScope: 'outside-session', permissions: ['access_control.read'] }
    ]
  },
  {
    key: 'feedback',
    label: 'Feedback',
    path: '/dashboard/feedback',
    icon: 'MessageSquare',
    sessionScope: 'both',
    permissions: ['dashboard.read'],
    children: [
      { key: 'feedback.inbox', label: 'Feedback Inbox', path: '/dashboard/feedback', sessionScope: 'both', permissions: ['dashboard.read'] },
      { key: 'feedback.route_issues', label: 'Route Issues & Ratings', path: '/dashboard/feedback/route-issues', sessionScope: 'both', permissions: ['dashboard.read'] }
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/dashboard/settings',
    icon: 'Settings',
    sessionScope: 'outside-session',
    permissions: ['settings.read'],
    children: [
      { key: 'settings.organization', label: 'Organization', path: '/dashboard/settings/organization', sessionScope: 'outside-session', permissions: ['settings.read'] },
      { key: 'settings.session_rules', label: 'Session Rules', path: '/dashboard/settings/session-rules', sessionScope: 'outside-session', permissions: ['settings.read'] },
      { key: 'settings.security', label: 'Security', path: '/dashboard/settings/security', sessionScope: 'outside-session', permissions: ['settings.read'] }
    ]
  }
];

function canSee(item, permissions) {
  if (!item.permissions || item.permissions.length === 0) return true;
  return item.permissions.some(permission => permissions.includes(permission));
}

function filterItem(item, permissions) {
  if (!canSee(item, permissions)) return null;
  const children = (item.children || [])
    .map(child => filterItem(child, permissions))
    .filter(Boolean);
  return { ...item, children };
}

function createSidebarService() {
  return {
    async getSidebar(authUser) {
      const permissions = authUser.permissions || [];
      const modules = MENU.map(item => filterItem(item, permissions)).filter(Boolean);
      return {
        role: authUser.role,
        permissions,
        modules
      };
    }
  };
}

module.exports = createSidebarService;
