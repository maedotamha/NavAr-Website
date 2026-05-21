const state = {
  token: localStorage.getItem("navarAdminToken") || localStorage.getItem("navarToken") || "",
  data: null,
  access: { roles: [], modules: [], users: [] },
  selectedRoleId: null,
  range: "7D",
  layers: {
    heat: true,
    routes: true,
    qr: true,
    nodes: true,
    pois: true
  }
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  setTimeout(() => el.classList.remove("is-visible"), 2600);
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== "/api/auth/login") {
    localStorage.removeItem("navarToken");
    localStorage.removeItem("navarAdminToken");
    state.token = "";
    window.top.location.href = "/login";
    throw new Error("Please sign in again");
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function ensureLogin() {
  const token = localStorage.getItem("navarAdminToken") || localStorage.getItem("navarToken");
  if (!token) {
    window.top.location.href = "/login";
    throw new Error("Please sign in to continue");
  }
  state.token = token;
  localStorage.setItem("navarToken", token);
  return { token };
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showView(id) {
  $$(".view").forEach(view => view.classList.toggle("is-visible", view.id === id));
  $$(".nav-tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.view === id));
  if (id === "access") loadAccessControl().catch(error => toast(error.message));
}

function tokenPayload() {
  try {
    const token = state.token || "";
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch (_error) {
    return {};
  }
}

function hasPermission(permission) {
  return (tokenPayload().permissions || []).includes(permission);
}

function applyNavigationPermissions() {
  const required = {
    dashboard: "dashboard.read",
    facilities: "facilities.read",
    maps: "maps.read",
    qr: "qr_anchors.read",
    analytics: "analytics.read",
    settings: "settings.read",
    access: "access_control.read"
  };
  $$(".nav-tab").forEach(tab => {
    const permission = required[tab.dataset.view];
    tab.hidden = Boolean(permission && !hasPermission(permission));
  });
}

function compactNumber(value) {
  if (value >= 1000) return `${Number((value / 1000).toFixed(value >= 10000 ? 1 : 2))}K`;
  return String(value);
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

function metricCard(icon, label, value, delta, tone) {
  return `
    <article class="metric-card">
      <div class="metric-top">
        <span class="metric-icon ${tone}">${icon}</span>
        <b>${delta}</b>
      </div>
      <strong>${value}</strong>
      <small>${label}</small>
    </article>
  `;
}

function renderMetrics(metrics) {
  const qr = state.data.qrHealth || {};
  const syncRate = qr.syncRate ?? Math.round(((qr.online || 0) / Math.max(qr.total || 1, 1)) * 100);
  const blocksActive = metrics.activeFacilities ?? 5;
  $("#metricGrid").innerHTML = [
    metricCard("◈", "Blocks Active", `${blocksActive} / 8`, "+ 0", "violet"),
    metricCard("▣", "QR Anchors Live", `${compactNumber(qr.online || metrics.qrCodesDeployed)}`, `${syncRate}% sync`, "purple"),
    metricCard("↗", "AR Sessions Today", compactNumber(metrics.activeUsersToday), "+ 24%", "blue"),
    metricCard("◉", "Localisation Accuracy", `${metrics.localizationAccuracy}%`, "+ 1.8%", "green"),
    metricCard("✓", "Route Success Rate", `${metrics.routeSuccess}%`, "+ 0.6%", "cyan"),
    metricCard("⏱", "Avg Dwell Time", formatDuration(Math.round((state.data.recentSessions || []).reduce((s, r) => s + r.durationSeconds, 0) / Math.max((state.data.recentSessions || []).length, 1))), "7D avg", "amber")
  ].join("");
}

function renderBlockStrip() {
  const el = document.getElementById("blockStrip");
  if (!el) return;
  const activeDefs = [
    { id:"B", label:"AI & Robotics",  count:2180 },
    { id:"C", label:"HPC & Data",     count:1640 },
    { id:"F", label:"Sust. Energy",   count:2540 },
    { id:"G", label:"Nuc. Reactor",   count:980  },
    { id:"H", label:"Central Lab",    count:3240 }
  ];
  el.innerHTML = [
    ...activeDefs.map(({ id, label, count }) => `
      <div class="block-chip active" data-bid="${id}" title="Block ${id} — ${label}">
        <span class="chip-dot online"></span>
        <b>Block ${id}</b>
        <small>${label}</small>
        <em>${compactNumber(count)} sessions</em>
      </div>`),
    ...["A","D","E"].map(id => `
      <div class="block-chip phase2" title="Block ${id} — Phase 2">
        <span class="chip-dot phase2"></span>
        <b>Block ${id}</b>
        <small>Phase 2</small>
        <em>—</em>
      </div>`)
  ].join("");
  el.querySelectorAll(".block-chip.active").forEach(chip => {
    chip.addEventListener("click", () => {
      const bi = CAMPUS_BLOCKS.findIndex(b => b.id === chip.dataset.bid);
      if (bi >= 0) { showView("dashboard"); drillIntoBlock(bi); }
    });
  });
}

function renderQrHealthBar() {
  const el = document.getElementById("qrHealthBar");
  if (!el) return;
  const qr = state.data.qrHealth || {};
  const total = qr.total || 1;
  const online  = qr.online  || 0;
  const warning = qr.warning || 0;
  const offline = qr.offline || 0;
  const pctOn  = Math.round((online  / total) * 100);
  const pctWar = Math.round((warning / total) * 100);
  const pctOff = Math.round((offline / total) * 100);
  el.innerHTML = `
    <div class="qrh-header">
      <h3>QR Anchor Health</h3>
      <span class="qrh-total">${total} total anchors</span>
    </div>
    <div class="qrh-bar">
      <div class="qrh-seg online"  style="width:${pctOn}%"  title="${online} online"></div>
      <div class="qrh-seg warning" style="width:${pctWar}%" title="${warning} warning"></div>
      <div class="qrh-seg offline" style="width:${pctOff}%" title="${offline} offline"></div>
    </div>
    <div class="qrh-legend">
      <span><i class="qrh-dot online"></i>${online} Online</span>
      <span><i class="qrh-dot warning"></i>${warning} Warning</span>
      <span><i class="qrh-dot offline"></i>${offline} Offline</span>
      <span class="qrh-sync">${qr.syncRate ?? pctOn}% sync rate</span>
    </div>`;
}

function renderSessionsFeed() {
  const el = document.getElementById("sessionsFeed");
  if (!el) return;
  const sessions = (state.data.recentSessions || []).slice(0, 8);
  if (!sessions.length) { el.innerHTML = `<p class="no-data">No sessions recorded yet.</p>`; return; }
  el.innerHTML = `<table class="sessions-table">
    <thead><tr><th>Route</th><th>Block</th><th>Duration</th><th>Accuracy</th><th>Status</th><th>When</th></tr></thead>
    <tbody>${sessions.map(s => {
      const statusClass = s.status === "successful" ? "online" : s.status === "recovered" ? "warning" : "offline";
      const blockId = (s.blockId || "block-f").replace("block-","").toUpperCase();
      const ago = s.startedAt ? relativeTime(s.startedAt) : "—";
      return `<tr>
        <td><strong>${s.routeLabel || s.routeId}</strong></td>
        <td><span class="block-badge">Blk ${blockId}</span></td>
        <td>${formatDuration(s.durationSeconds)}</td>
        <td>${Math.round((s.localizationAccuracy || 0.9) * 100)}%</td>
        <td><span class="status-pill ${statusClass}">${s.status}</span></td>
        <td class="muted-cell">${ago}</td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
}

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function pointsForLine(series, key, width, height, padding, max) {
  return series.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
    const y = height - padding - (item[key] / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
}

function renderUsageChart() {
  const series = state.data.trends.navigationUsage[state.range];
  const width = 780;
  const height = 250;
  const padding = 38;
  const max = Math.max(...series.flatMap(item => [item.requests, item.successful])) * 1.12;
  const grid = [0.25, 0.5, 0.75, 1].map(mark => {
    const y = height - padding - mark * (height - padding * 2);
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="grid-line" />`;
  }).join("");
  const labels = series.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
    return `<text x="${x}" y="${height - 8}" text-anchor="middle">${item.label}</text>`;
  }).join("");

  $("#usageChart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Navigation usage line chart">
      ${grid}
      <polygon points="${padding},${height - padding} ${pointsForLine(series, "requests", width, height, padding, max)} ${width - padding},${height - padding}" class="chart-fill" />
      <polyline points="${pointsForLine(series, "requests", width, height, padding, max)}" class="line requests" />
      <polyline points="${pointsForLine(series, "successful", width, height, padding, max)}" class="line successful" />
      ${labels}
      <g class="legend-chart">
        <circle cx="74" cy="24" r="4" class="requests-dot" /><text x="84" y="28">Navigation Requests</text>
        <circle cx="226" cy="24" r="4" class="success-dot" /><text x="236" y="28">Successful Routes</text>
      </g>
    </svg>
  `;
}

function renderStatus() {
  $("#systemStatus").innerHTML = state.data.systemStatus.map(item => `
    <article class="status-item">
      <span class="status-icon ${item.level}"></span>
      <div>
        <strong>${item.name}</strong>
        <small>${item.state}</small>
      </div>
      <i class="${item.level}"></i>
    </article>
  `).join("");
}

function renderAlerts() {
  $("#alertList").innerHTML = state.data.alerts.map(alert => `
    <article class="alert ${alert.level}">
      <span></span>
      <div>
        <strong>${alert.title}</strong>
        <p>${alert.message}</p>
        <small>${alert.time}</small>
      </div>
    </article>
  `).join("");
}

function renderBars(selector, rows, labelKey, valueKey, suffix = "") {
  const max = Math.max(...rows.map(row => row[valueKey]), 1);
  $(selector).innerHTML = rows.map(row => `
    <article class="usage-row">
      <div>
        <strong>${row[labelKey]}</strong>
        ${row.zone ? `<small>${row.zone}</small>` : ""}
      </div>
      <div class="progress"><span style="width:${(row[valueKey] / max) * 100}%"></span></div>
      <b>${row[valueKey].toLocaleString()}${suffix}</b>
    </article>
  `).join("");
}

function floorName(floorId) {
  return state.data.map.floors.find(floor => floor.id === floorId)?.name || floorId;
}

function renderFacilities() {
  const stats = state.data.map.facilityStats;
  $("#facilityCards").innerHTML = stats.cards.map((facility, index) => `
    <article class="detail-card facility-card">
      <div class="facility-art art-${index % 3}">
        <span>${facility.status}</span>
        <i></i>
      </div>
      <h2>${facility.name}</h2>
      <p>${facility.location}</p>
      <div class="facility-stats">
        <span>Total Floors <b>${facility.floors}</b></span>
        <span>Total Area <b>${facility.area}</b></span>
      </div>
      <footer><small>${facility.qrCodes} QR Codes</small><a href="#maps">View Details -></a></footer>
    </article>
  `).join("");

  $("#facilityMetrics").innerHTML = [
    metricCard("B", "Total Facilities", stats.totalFacilities, "+ 12%", "blue"),
    metricCard("F", "Total Floors", stats.totalFloors, "+ 8%", "purple"),
    metricCard("Q", "Active QR Codes", compactNumber(stats.activeQrCodes), "+ 24%", "green"),
    metricCard("N", "Navigation Points", compactNumber(stats.navigationPoints), "+ 16%", "amber")
  ].join("");
}

function renderQrRows() {
  const health = state.data.qrHealth;
  $("#qrMetrics").innerHTML = [
    metricCard("Q", "Total QR Codes", health.total.toLocaleString(), "+12%", "purple"),
    metricCard("A", "Active QR Codes", health.online.toLocaleString(), "+8%", "green"),
    metricCard("P", "Pending Assignment", health.warning.toLocaleString(), "+4%", "amber"),
    metricCard("I", "Inactive Codes", health.offline.toLocaleString(), "-2%", "red")
  ].join("");
  $("#qrEntryCount").textContent = `Showing 1 to ${state.data.map.qrCodes.length} of ${health.total.toLocaleString()} entries`;
  $("#qrRows").innerHTML = state.data.map.qrCodes.map(qr => `
    <tr>
      <td><strong>${qr.label}</strong><br><small>${qr.id}</small></td>
      <td>${state.data.map.nodes.find(node => node.id === qr.nodeId)?.label || qr.nodeId}</td>
      <td>RTC/RD Block F / ${floorName(qr.floorId)}</td>
      <td><span class="status-pill ${qr.status}">${qr.status}</span></td>
      <td>${qr.scanCount.toLocaleString()}</td>
      <td>${new Date(qr.lastSync).toLocaleString()}</td>
    </tr>
  `).join("");
}

function renderRoutes() {
  $("#routeRows").innerHTML = state.data.routeUsage.map(route => `
    <tr>
      <td><strong>${route.label}</strong><br><small>${route.distanceMeters} m</small></td>
      <td>${route.uses}</td>
      <td>${route.successRate}%</td>
      <td>${formatDuration(route.avgDurationSeconds)}</td>
      <td>${route.recoveryEvents}</td>
    </tr>
  `).join("");
}

function renderZones() {
  $("#zoneGrid").innerHTML = state.data.zoneEvaluation.map(zone => `
    <article class="zone-card ${zone.status === "Needs attention" ? "attention" : ""}">
      <div>
        <span>${zone.type}</span>
        <h3>${zone.name}</h3>
      </div>
      <div class="zone-stats">
        <b>${zone.congestion}%</b><small>Congestion</small>
        <b>${zone.localizationQuality}%</b><small>Localization</small>
        <b>${zone.recoveryEvents}</b><small>Recoveries</small>
      </div>
      <p>${zone.recommendation}</p>
    </article>
  `).join("");
}

function renderSettings() {
  const stats = state.data.map.settingStats;
  $("#settingsMetrics").innerHTML = [
    metricCard("U", "Uptime", stats.uptime, "Last 30 days", "violet"),
    metricCard("U", "Active Users", stats.activeUsers.toLocaleString(), "+12% from yesterday", "blue"),
    metricCard("A", "API Response", stats.apiResponse, "Average response time", "green"),
    metricCard("S", "Storage", stats.storage, "340GB of 500GB used", "purple")
  ].join("");
  $("#settingTimezone").textContent = stats.timezone;
  $("#settingLanguage").textContent = stats.language;
  $("#settingTimeout").textContent = stats.sessionTimeout;
  $("#settingCache").textContent = stats.cacheDuration;
  $("#performanceRows").innerHTML = state.data.map.performanceLogs.map(log => `
    <tr>
      <td>${log.timestamp}</td>
      <td>${log.eventType}</td>
      <td>${log.component}</td>
      <td><span class="status-pill ${log.status.toLowerCase()}">${log.status}</span></td>
      <td>${log.details}</td>
    </tr>
  `).join("");
  $("#maintenanceTasks").innerHTML = state.data.map.maintenanceTasks.map(task => `
    <article class="task-card">
      <span class="metric-icon purple">T</span>
      <div>
        <strong>${task.name}</strong>
        <small>Next run: ${task.nextRun}</small>
        <small>${task.schedule}</small>
      </div>
      <b>${task.status}</b>
    </article>
  `).join("");
}

function renderSelectors() {
  $("#routeSelect").innerHTML = state.data.routeUsage.map(route => `<option value="${route.id}">${route.label}</option>`).join("");
}

function setRoleForm(role) {
  state.selectedRoleId = role?.id || null;
  $("#roleCatalogPanel").hidden = Boolean(role);
  $("#roleWorkspace").hidden = !role;
  $("#moduleManager").hidden = true;
  $("#userManager").hidden = true;
  $("#roleId").value = role?.id || "";
  $("#roleKey").value = role?.key || "";
  $("#roleKey").disabled = Boolean(role?.id);
  $("#roleName").value = role?.name || "";
  $("#roleDescription").value = role?.description || "";
  $("#deleteRoleButton").disabled = !role || role.is_system;
  $("#workspaceRoleName").textContent = role?.name || "New Role";
  $("#workspaceRoleMeta").textContent = role ? `${role.permissions.length} permissions across ${countModulesForRole(role)} modules` : "Define the role and choose permissions";
  renderRoleDetailSummary(role);
  renderPermissionMatrix(role?.permissions || []);
  $$("#roleList .role-item").forEach(item => item.classList.toggle("is-active", Number(item.dataset.id) === Number(state.selectedRoleId)));
  renderUserRoleList();
}

function setNewRoleForm() {
  state.selectedRoleId = null;
  $("#roleCatalogPanel").hidden = true;
  $("#roleWorkspace").hidden = false;
  $("#moduleManager").hidden = true;
  $("#userManager").hidden = true;
  $("#roleId").value = "";
  $("#roleKey").value = "";
  $("#roleKey").disabled = false;
  $("#roleName").value = "";
  $("#roleDescription").value = "";
  $("#deleteRoleButton").disabled = true;
  $("#workspaceRoleName").textContent = "New Role";
  $("#workspaceRoleMeta").textContent = "Define the role and choose permissions";
  renderRoleDetailSummary(null);
  renderPermissionMatrix([]);
  renderUserRoleList();
}

function renderAccessControl() {
  renderAccessStats();
  renderRoleCatalog();
  renderModuleList();
  renderUserManager();
  if (state.selectedRoleId) {
    const selected = state.access.roles.find(role => role.id === Number(state.selectedRoleId));
    if (selected) setRoleForm(selected);
  }
}

function renderAccessStats() {
  const { roles, modules, users } = state.access;
  const permissionCount = modules.reduce((sum, module) => sum + module.actions.length, 0);
  $("#accessStats").innerHTML = [
    metricCard("R", "Roles", roles.length, "active", "violet"),
    metricCard("U", "Admin Users", users.length, "assignable", "blue"),
    metricCard("M", "Modules", modules.length, "secured", "green"),
    metricCard("P", "Permissions", permissionCount, "actions", "purple")
  ].join("");
}

function renderRoleCatalog() {
  const query = ($("#roleSearch")?.value || "").trim().toLowerCase();
  const roles = state.access.roles.filter(role => [role.name, role.key, role.description].join(" ").toLowerCase().includes(query));
  $("#roleList").innerHTML = roles.map(role => `
    <button class="role-card" data-id="${role.id}" type="button">
      <span class="role-card-top"><strong>${role.name}</strong>${role.is_system ? "<em>System</em>" : ""}</span>
      <small>${role.key}</small>
      <p>${role.description || "No description yet."}</p>
      <span class="role-card-foot"><b>${role.permissions.length}</b> permissions <i>${assignedUserCount(role.id)} users</i></span>
    </button>
  `).join("") || `<div class="empty-state">No roles match that search.</div>`;
  $("#roleList").querySelectorAll(".role-item").forEach(button => {
    button.addEventListener("click", () => setRoleForm(roles.find(role => role.id === Number(button.dataset.id))));
  });
  $("#roleList").querySelectorAll(".role-card").forEach(button => {
    button.addEventListener("click", () => setRoleForm(state.access.roles.find(role => role.id === Number(button.dataset.id))));
  });
}

function renderPermissionMatrix(selectedPermissions) {
  $("#permissionMatrix").innerHTML = state.access.modules.map(module => `
    <article class="permission-module">
      <header><div><strong>${module.name}</strong><small>${module.description || module.key}</small></div><b>${module.actions.filter(action => selectedPermissions.includes(action.permission)).length}/${module.actions.length}</b></header>
      <div class="permission-actions">
        ${module.actions.map(action => `
          <label class="permission-check">
            <input type="checkbox" name="permissions" value="${action.permission}" ${selectedPermissions.includes(action.permission) ? "checked" : ""}>
            <span>${action.name}</span>
          </label>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function renderUserRoleList() {
  const selectedRole = Number(state.selectedRoleId);
  const options = state.access.roles.map(role => `<option value="${role.id}">${role.name}</option>`).join("");
  const sortedUsers = [...state.access.users].sort((a, b) => (b.role_id === selectedRole) - (a.role_id === selectedRole));
  $("#userRoleList").innerHTML = sortedUsers.map(user => `
    <article class="user-role-row">
      <div><strong>${user.full_name}</strong><small>${user.email}</small>${user.role_id === selectedRole ? "<em>Assigned here</em>" : ""}</div>
      <select data-user-id="${user.id}">${options}</select>
    </article>
  `).join("");
  $("#userRoleList").querySelectorAll("select").forEach(select => {
    const user = state.access.users.find(item => item.id === Number(select.dataset.userId));
    select.value = user?.role_id || "";
    select.addEventListener("change", async () => {
      await api(`/api/access-control/users/${select.dataset.userId}/role`, { method: "PATCH", body: JSON.stringify({ roleId: Number(select.value) }) });
      toast("User role updated. Ask the user to sign in again for a refreshed token.");
      await loadAccessControl();
    });
  });
}

function renderUserManager() {
  const roleOptions = state.access.roles.map(role => `<option value="${role.id}">${role.name}</option>`).join("");
  $("#userRoleSelect").innerHTML = roleOptions;
  const samples = [
    ["Admin", "admin@navar.local", "Admin@12345", "Full access"],
    ["Facility", "facility@navar.local", "Facility@12345", "Operational access"],
    ["Analyst", "analyst@navar.local", "Analyst@12345", "Read-only analytics"]
  ];
  $("#sampleAccountStrip").innerHTML = samples.map(sample => `
    <article><strong>${sample[0]}</strong><span>${sample[1]}</span><code>${sample[2]}</code><small>${sample[3]}</small></article>
  `).join("");
  $("#userTableList").innerHTML = state.access.users.map(user => `
    <article class="user-table-row">
      <div><strong>${user.full_name}</strong><small>${user.email}</small></div>
      <span class="status-pill ${user.is_active ? "online" : "offline"}">${user.is_active ? "active" : "inactive"}</span>
      <b>${user.role_name || user.role}</b>
      <div><button class="ghost-button user-edit" data-id="${user.id}" type="button">Edit</button><button class="ghost-button danger-button user-delete" data-id="${user.id}" type="button">Delete</button></div>
    </article>
  `).join("");
  $("#userTableList").querySelectorAll(".user-edit").forEach(button => {
    button.addEventListener("click", () => {
      const user = state.access.users.find(item => item.id === Number(button.dataset.id));
      $("#userForm").hidden = false;
      $("#userId").value = user.id;
      $("#userFullName").value = user.full_name;
      $("#userEmail").value = user.email;
      $("#userRoleSelect").value = user.role_id || "";
      $("#userPassword").value = "";
      $("#userIsActive").checked = user.is_active !== false;
    });
  });
  $("#userTableList").querySelectorAll(".user-delete").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this user account?")) return;
      await api(`/api/access-control/users/${button.dataset.id}`, { method: "DELETE" });
      toast("User deleted");
      await loadAccessControl();
    });
  });
}

function renderRoleDetailSummary(role) {
  const moduleCount = role ? countModulesForRole(role) : 0;
  $("#roleDetailSummary").innerHTML = [
    `<div><span>Assigned users</span><b>${role ? assignedUserCount(role.id) : 0}</b></div>`,
    `<div><span>Enabled modules</span><b>${moduleCount}</b></div>`,
    `<div><span>Permission actions</span><b>${role?.permissions.length || 0}</b></div>`
  ].join("");
}

function assignedUserCount(roleId) {
  return state.access.users.filter(user => Number(user.role_id) === Number(roleId)).length;
}

function countModulesForRole(role) {
  return state.access.modules.filter(module => module.actions.some(action => role.permissions.includes(action.permission))).length;
}

function renderModuleList() {
  $("#moduleList").innerHTML = state.access.modules.map(module => `
    <article class="module-item">
      <div><strong>${module.name}</strong><small>${module.actions.map(action => action.name).join(", ")}</small></div>
      <div>
        <button class="ghost-button module-edit" data-id="${module.id}" type="button">Edit</button>
        <button class="ghost-button danger-button module-delete" data-id="${module.id}" type="button">Delete</button>
      </div>
    </article>
  `).join("");
  $("#moduleList").querySelectorAll(".module-edit").forEach(button => {
    button.addEventListener("click", () => {
      const module = state.access.modules.find(item => item.id === Number(button.dataset.id));
      $("#moduleId").value = module.id;
      $("#moduleKey").value = module.key;
      $("#moduleKey").disabled = true;
      $("#moduleName").value = module.name;
      $("#moduleDescription").value = module.description || "";
      $("#moduleActions").value = module.actions.map(action => action.name).join(", ");
    });
  });
  $("#moduleList").querySelectorAll(".module-delete").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this module and all related permissions?")) return;
      await api(`/api/access-control/modules/${button.dataset.id}`, { method: "DELETE" });
      toast("Module deleted");
      await loadAccessControl();
    });
  });
}

async function loadAccessControl() {
  state.access = await api("/api/access-control");
  renderAccessControl();
}

function resetModuleForm() {
  $("#moduleId").value = "";
  $("#moduleKey").value = "";
  $("#moduleKey").disabled = false;
  $("#moduleName").value = "";
  $("#moduleDescription").value = "";
  $("#moduleActions").value = "read, create, update, delete";
}

function resetUserForm() {
  $("#userForm").hidden = false;
  $("#userId").value = "";
  $("#userFullName").value = "";
  $("#userEmail").value = "";
  $("#userPassword").value = "";
  $("#userIsActive").checked = true;
  $("#userRoleSelect").value = state.access.roles[0]?.id || "";
}

function svgElement(name, attributes = {}, text = "") {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  if (text) el.textContent = text;
  return el;
}

function scalePoint(point) {
  return { x: point.x * 10, y: point.y * 6.8 };
}

function polygonPoints(points) {
  return points.map(([x, y]) => `${x * 10},${y * 6.8}`).join(" ");
}

function renderMap() {
  if (floorViewOpen) return; // floor plan is active — don't overwrite it
  const svg = $("#buildingMap");
  svg.innerHTML = "";
  const defs = svgElement("defs");
  defs.innerHTML = `
    <filter id="glow"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="roomGradient" x1="0" x2="1"><stop offset="0" stop-color="#fbfcff"/><stop offset="1" stop-color="#f4f7ff"/></linearGradient>
  `;
  svg.appendChild(defs);
  svg.appendChild(svgElement("rect", { x: 35, y: 45, width: 920, height: 570, rx: 28, class: "map-bg" }));

  for (const column of state.data.map.grid.columns) {
    const x = column.x * 10;
    svg.appendChild(svgElement("line", { x1: x, y1: 58, x2: x, y2: 610, class: "grid-axis" }));
    svg.appendChild(svgElement("text", { x, y: 42, class: "grid-label", "text-anchor": "middle" }, column.label));
  }

  for (const row of state.data.map.grid.rows) {
    const y = row.y * 6.8;
    svg.appendChild(svgElement("line", { x1: 52, y1: y, x2: 965, y2: y, class: "grid-axis" }));
    svg.appendChild(svgElement("text", { x: 28, y: y + 5, class: "grid-label", "text-anchor": "middle" }, row.label));
  }

  for (const feature of state.data.map.blockFeatures) {
    const poly = svgElement("polygon", { points: polygonPoints(feature.polygon), class: `block-feature ${feature.kind}` });
    svg.appendChild(poly);
    const cx = feature.polygon.reduce((sum, point) => sum + point[0], 0) / feature.polygon.length * 10;
    const cy = feature.polygon.reduce((sum, point) => sum + point[1], 0) / feature.polygon.length * 6.8;
    svg.appendChild(svgElement("text", { x: cx, y: cy, class: "feature-label", "text-anchor": "middle" }, feature.name));
  }

  for (const zone of state.data.map.zones) {
    const poly = svgElement("polygon", { points: polygonPoints(zone.polygon), class: "zone-shape", "data-zone": zone.id });
    svg.appendChild(poly);
    const cx = zone.polygon.reduce((sum, point) => sum + point[0], 0) / zone.polygon.length * 10;
    const cy = zone.polygon.reduce((sum, point) => sum + point[1], 0) / zone.polygon.length * 6.8;
    svg.appendChild(svgElement("text", { x: cx, y: cy, class: "zone-label", "text-anchor": "middle" }, zone.name));
  }

  if (state.layers.heat) {
    for (const point of state.data.map.heatPoints) {
      const pos = scalePoint(point);
      const radius = 22 + point.normalized * 60;
      svg.appendChild(svgElement("circle", { cx: pos.x, cy: pos.y, r: radius, class: "heat", opacity: 0.18 + point.normalized * 0.5 }));
    }
  }

  if (state.layers.routes) {
    for (const route of state.data.map.routes) {
      const path = route.path.map((point, index) => {
        const pos = scalePoint(point);
        return `${index === 0 ? "M" : "L"} ${pos.x} ${pos.y}`;
      }).join(" ");
      svg.appendChild(svgElement("path", { d: path, class: "route-path" }));
    }
  }

  if (state.layers.nodes) {
    for (const node of state.data.map.nodes) {
      const pos = scalePoint(node);
      svg.appendChild(svgElement("circle", { cx: pos.x, cy: pos.y, r: 5, class: "node-dot" }));
    }
  }

  if (state.layers.pois) {
    for (const poi of state.data.map.pois) {
      const pos = scalePoint(poi);
      svg.appendChild(svgElement("circle", { cx: pos.x, cy: pos.y, r: 10, class: "poi-pin" }));
      svg.appendChild(svgElement("text", { x: pos.x + 14, y: pos.y + 4, class: "poi-label" }, poi.name));
    }
  }

  if (state.layers.qr) {
    for (const qr of state.data.map.qrCodes) {
      const pos = scalePoint(qr);
      svg.appendChild(svgElement("rect", { x: pos.x - 9, y: pos.y - 9, width: 18, height: 18, rx: 4, class: `qr-marker ${qr.status}` }));
      svg.appendChild(svgElement("text", { x: pos.x, y: pos.y + 4, class: "qr-text", "text-anchor": "middle" }, "QR"));
    }
  }

  $("#zoneCount").textContent = state.data.map.zones.length;
  $("#nodeCount").textContent = state.data.map.nodes.length;
  $("#poiCount").textContent = state.data.map.pois.length;
  $("#qrCount").textContent = state.data.map.qrCodes.length;
}

function renderAll() {
  renderMetrics(state.data.metrics);
  renderBlockStrip();
  renderQrHealthBar();
  renderSessionsFeed();
  renderUsageChart();
  renderStatus();
  renderAlerts();
  renderBars("#topAreas", state.data.trends.blockVisits, "label", "visits", " visits");
  renderBars("#topPois", state.data.topPois, "name", "visits", " visits");
  renderMap();
  renderFacilities();
  renderQrRows();
  renderRoutes();
  renderZones();
  renderSettings();
  renderSelectors();
  renderCampusBlockGrid();
}

async function loadDashboard() {
  const [dashboardData, apiData] = await Promise.all([
    fetch("/dashboard-ui/dashboard.json").then(response => response.json()),
    api("/api/admin/dashboard").catch(() => null)
  ]);
  state.data = apiData?.metrics ? { ...dashboardData, ...apiData, map: { ...dashboardData.map, ...(apiData.map || {}) } } : dashboardData;
  renderAll();
}

function setupEvents() {
  $$(".nav-tab").forEach(tab => tab.addEventListener("click", () => showView(tab.dataset.view)));
  $("#refreshButton").addEventListener("click", () => loadDashboard().then(() => toast("Dashboard refreshed")));

  $("#rangeControls").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    state.range = button.dataset.range;
    $$("#rangeControls button").forEach(item => item.classList.toggle("is-active", item === button));
    renderUsageChart();
  });

  $("#mapToggles").addEventListener("change", event => {
    const input = event.target.closest("input");
    if (!input) return;
    state.layers[input.value] = input.checked;
    renderMap();
  });

  const loginForm = $("#loginForm");
  if (loginForm) loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    state.token = data.token;
    localStorage.setItem("navarToken", data.token);
    localStorage.setItem("navarAdminToken", data.token);
    localStorage.setItem("navarAdmin", JSON.stringify(data.admin));
    applyNavigationPermissions();
    toast(`Signed in as ${data.admin.role}`);
    await loadDashboard();
  });

  const sessionForm = $("#sessionForm");
  if (sessionForm) sessionForm.addEventListener("submit", async event => {
    event.preventDefault();
    const body = formData(event.currentTarget);
    body.includeRecovery = event.currentTarget.includeRecovery.checked;
    await api("/api/admin/seed-session", { method: "POST", body: JSON.stringify(body) });
    toast("Route usage stored; heat map updated");
    await loadDashboard();
    showView("dashboard");
  });

  const newRoleButton = $("#newRoleButton");
  if (newRoleButton) newRoleButton.addEventListener("click", setNewRoleForm);

  const backToRolesButton = $("#backToRolesButton");
  if (backToRolesButton) backToRolesButton.addEventListener("click", () => {
    state.selectedRoleId = null;
    $("#roleCatalogPanel").hidden = false;
    $("#roleWorkspace").hidden = true;
    $("#userManager").hidden = true;
  });

  const manageModulesButton = $("#manageModulesButton");
  if (manageModulesButton) manageModulesButton.addEventListener("click", () => {
    $("#roleCatalogPanel").hidden = true;
    $("#roleWorkspace").hidden = true;
    $("#userManager").hidden = true;
    $("#moduleManager").hidden = false;
  });

  const closeModulesButton = $("#closeModulesButton");
  if (closeModulesButton) closeModulesButton.addEventListener("click", () => {
    $("#moduleManager").hidden = true;
    $("#roleCatalogPanel").hidden = false;
  });

  const manageUsersButton = $("#manageUsersButton");
  if (manageUsersButton) manageUsersButton.addEventListener("click", () => {
    $("#roleCatalogPanel").hidden = true;
    $("#roleWorkspace").hidden = true;
    $("#moduleManager").hidden = true;
    $("#userManager").hidden = false;
    $("#userForm").hidden = true;
  });

  const closeUsersButton = $("#closeUsersButton");
  if (closeUsersButton) closeUsersButton.addEventListener("click", () => {
    $("#userManager").hidden = true;
    $("#roleCatalogPanel").hidden = false;
  });

  const roleSearch = $("#roleSearch");
  if (roleSearch) roleSearch.addEventListener("input", renderRoleCatalog);

  const roleForm = $("#roleForm");
  if (roleForm) roleForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.elements.id.value;
    const permissions = [...form.querySelectorAll("input[name='permissions']:checked")].map(input => input.value);
    const body = { key: form.elements.key.value, name: form.elements.name.value, description: form.elements.description.value, permissions };
    await api(`/api/access-control/roles${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    toast("Role saved");
    await loadAccessControl();
    const saved = state.access.roles.find(role => role.key === body.key || role.name === body.name);
    if (saved) setRoleForm(saved);
  });

  const deleteRoleButton = $("#deleteRoleButton");
  if (deleteRoleButton) deleteRoleButton.addEventListener("click", async () => {
    const id = $("#roleId").value;
    if (!id || !confirm("Delete this role?")) return;
    await api(`/api/access-control/roles/${id}`, { method: "DELETE" });
    toast("Role deleted");
    state.selectedRoleId = null;
    await loadAccessControl();
    $("#roleCatalogPanel").hidden = false;
    $("#roleWorkspace").hidden = true;
  });

  const moduleForm = $("#moduleForm");
  if (moduleForm) moduleForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.elements.id.value;
    const body = {
      key: form.elements.key.value,
      name: form.elements.name.value,
      description: form.elements.description.value,
      actions: form.elements.actions.value.split(",").map(value => value.trim()).filter(Boolean)
    };
    await api(`/api/access-control/modules${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    resetModuleForm();
    toast("Module saved");
    await loadAccessControl();
  });

  const resetModuleButton = $("#resetModuleButton");
  if (resetModuleButton) resetModuleButton.addEventListener("click", resetModuleForm);

  const userForm = $("#userForm");
  if (userForm) userForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.elements.id.value;
    const body = {
      full_name: form.elements.full_name.value,
      email: form.elements.email.value,
      roleId: Number(form.elements.role_id.value),
      password: form.elements.password.value,
      is_active: form.elements.is_active.checked
    };
    if (!body.password) delete body.password;
    await api(`/api/access-control/users${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    resetUserForm();
    $("#userForm").hidden = true;
    toast("User saved");
    await loadAccessControl();
  });

  const resetUserButton = $("#resetUserButton");
  if (resetUserButton) resetUserButton.addEventListener("click", resetUserForm);

  const newUserButton = $("#newUserButton");
  if (newUserButton) newUserButton.addEventListener("click", resetUserForm);

  const cancelUserButton = $("#cancelUserButton");
  if (cancelUserButton) cancelUserButton.addEventListener("click", () => {
    resetUserForm();
    $("#userForm").hidden = true;
  });
}

setupEvents();
ensureLogin().then(() => {
  applyNavigationPermissions();
  return loadDashboard();
}).catch(error => toast(error.message));

/* ═══════════════════════════════════════════════════════════
   CAMPUS HEAT MAP ENGINE  –  AASTU RTC AR Navigation Analytics
   ═══════════════════════════════════════════════════════════ */

/*
  Campus layout (top-down, 780×460 canvas):

      [F — top-left ]          [ B — top-right]
               [ H — central hub        ]
      [G — bot-left ]          [ C — bot-right]

  Only the 5 active blocks are drawn; Phase-2 blocks A, D, E
  appear in the UI strip only (no canvas polygon).
*/
const CAMPUS_BLOCKS = [
  {
    id: "F", label: "Block F\nSust. Energy", color: "#e91e63",
    // Top-left — wide wing extends far right to x:326, body narrows back to x:220
    shape: [
      [32,  42], [326, 42],
      [326, 148],[220, 148],
      [220, 215],[32,  215]
    ],
    floors: 6,
    usage: 0.91, dwell: 0.82, qr: 0.94, success: 0.88,
    sessions: 2540, avgDwell: 465, qrCount: 48, successRate: 88,
    description: "Sustainable Energy Technology Excellence Center — Wind Turbine & Renewable Energy Array"
  },
  {
    id: "B", label: "Block B\nAI & Robotics", color: "#2f7df6",
    // Top-right — wide wing extends far left to x:426; twin staircase notches on east facade
    shape: [
      [426, 42], [752, 42],
      [752, 148],[714, 148],
      [714, 215],[686, 215],
      [686, 255],[618, 255],
      [618, 215],[426, 215]
    ],
    floors: 5,
    usage: 0.92, dwell: 0.85, qr: 0.88, success: 0.90,
    sessions: 2180, avgDwell: 512, qrCount: 36, successRate: 90,
    description: "AI & Robotics Excellence Center — Granite Elevator Lobby, Modular Research Labs"
  },
  {
    id: "H", label: "Block H\nCentral Lab", color: "#546e7a",
    // Small central connector — x:326-426 (100px wide), sits between F and B wings
    shape: [
      [326, 148],[426, 148],
      [426, 368],[326, 368]
    ],
    floors: 6,
    usage: 0.96, dwell: 0.91, qr: 0.87, success: 0.87,
    sessions: 3240, avgDwell: 680, qrCount: 55, successRate: 87,
    description: "Central Laboratory Hub — G+5, 1,648 m² per floor, Polycarbonate Curtain-Wall Entrance"
  },
  {
    id: "G", label: "Block G\nNuclear Rct.", color: "#9c27b0",
    // Bottom-left — Nuclear Reactor Excellence Center
    // top flush with Block F bottom (y:215) — no gap on left facade
    shape: [
      [32, 215],[220, 215],
      [220, 422],[32,  422]
    ],
    floors: 4,
    usage: 0.76, dwell: 0.79, qr: 0.70, success: 0.91,
    sessions: 980, avgDwell: 495, qrCount: 22, successRate: 91,
    description: "Nuclear Reactor Excellence Center — Wide Granite Lobby, Executive Meeting Room, Porcelain Offices"
  },
  {
    id: "C", label: "Block C\nHPC & Data", color: "#00bcd4",
    // Bottom-right — left edge aligns with B's left edge (x:426)
    shape: [
      [426, 258],[752, 258],
      [752, 432],[426, 432]
    ],
    floors: 6,
    usage: 0.80, dwell: 0.88, qr: 0.78, success: 0.86,
    sessions: 1640, avgDwell: 580, qrCount: 30, successRate: 86,
    description: "HPC & Big Data Analytics — Underground Parking (CAR #61), HPC Computing Floors"
  }
];

/* ═══════════════════════════════════════════════════════════
   FLOOR NAVIGATION ENGINE
   ═══════════════════════════════════════════════════════════ */

const floorState = { blockIdx: -1, floorIdx: 0 };

// Compact room constructor
const R = (name, x, y, w, h, type) => ({ name, x, y, w, h, type });

// ── Architectural floor plan data (SVG canvas: viewBox 0 0 1000 680) ──────
// Working area: x:20–980, y:60–660. Rooms clipped to these bounds.

const BLOCK_FLOOR_PLANS = {

  /* ── Block H: Central Connecting Spine (Ground + Floors 1–5) ── */
  H: Array.from({ length: 6 }, (_, i) => ({
    label: i === 0 ? "Ground Floor — Main Spine" : `Floor ${i} — Circulation Spine`,
    rooms: [
      R("Pedestrian Lobby — West Wing Entry",  20,  60, 230, 210, "lobby"),
      R("Pedestrian Lobby — East Wing Entry", 750,  60, 230, 210, "lobby"),
      R("N-S Cross Corridor",                 456,  60,  88, 600, "corridor"),
      R("E-W Circulation Spine",               20, 290, 960,  80, "corridor"),
      R("Stairwell A (NW)",                    20, 380, 115, 150, "stair"),
      R("Elevator Core A",                    145, 380, 110, 150, "elevator"),
      R("Vertical Service Core A",            265, 380, 100, 150, "service"),
      R("Vertical Service Core B",            635, 380, 100, 150, "service"),
      R("Elevator Core B",                    745, 380, 110, 150, "elevator"),
      R("Stairwell B (NE)",                   865, 380, 115, 150, "stair"),
      R("Sanitary Block (West)",               20, 540, 230, 120, "toilet"),
      R("Sanitary Block (East)",              750, 540, 230, 120, "toilet"),
    ]
  })),

  /* ── Block B: AI & Robotics Excellence Center ──────────────────────────
     5 floors · floor-to-floor height 4.00 m
     Wet service column (Ladies/Gents/DWC/Janitor) stacks on NW flank
     ──────────────────────────────────────────────────────────────────── */
  B: [
    /* ── Level 1 — Ground Floor (Administrative & Entry Base) ── */
    {
      label: "Level 1 — Ground Floor (Administrative & Entry)",
      rooms: [
        // ─── Main entrance ───────────────────────────────────────
        R("Main Entrance Lobby  115.00 m²",        20,  60, 390, 280, "lobby"),
        // ─── Executive suite (NE corner) ─────────────────────────
        R("Director of Research Center  28.60 m²", 420,  60, 165, 155, "office"),
        R("Deputy Director Office  29.52 m²",      595,  60, 165, 155, "office"),
        // ─── Secretary buffer cells ───────────────────────────────
        R("Secretary Office Cell 1  16.39 m²",     420, 225, 100, 130, "office"),
        R("Secretary Office Cell 2  18.72 m²",     530, 225, 115, 130, "office"),
        // ─── Vertical circulation (NE) ────────────────────────────
        R("Stairwell",                             770,  60, 105, 155, "stair"),
        R("Elevator Core",                         885,  60, 115, 200, "elevator"),
        // ─── Open-plan staff areas ────────────────────────────────
        R("Support Staff Suite A  63.51 m²",        20, 350, 340, 165, "office"),
        R("Support Staff Suite B  70.09 m²",       370, 350, 375, 165, "office"),
        // ─── NW wet service column ────────────────────────────────
        R("Ladies' Toilet  14.30 m²",               20, 525, 130, 100, "toilet"),
        R("Gent's Toilet  12.40 m²",               160, 525, 115, 100, "toilet"),
        R("Disabled Toilet  4.41 m²",              285, 525,  80, 100, "toilet"),
        R("Janitor Room  4.35 m²",                 375, 525,  78, 100, "service"),
        // ─── Circulation ──────────────────────────────────────────
        R("Main Corridor",                          20, 635, 960,  45, "corridor"),
      ]
    },

    /* ── Levels 2, 3, 4 — Research Operations / Collaboration / Analytics ── */
    ...["Level 2 — Research Operations & Breakout Deck",
        "Level 3 — Advanced Computing & Collaboration Deck",
        "Level 4 — Analytics & Team Briefing Floor"].map((label, i) => ({
      label,
      rooms: [
        // ─── Central distribution lobby ───────────────────────────
        R("Central Floor Lobby  115.00 m²",        700,  60, 280, 345, "lobby"),
        // ─── Large meeting / seminar space ────────────────────────
        R("Main Interactive Meeting Room  110.98 m²",
                                                    20,  60, 670, 280, "meeting"),
        // ─── Research offices flanking the corridor ───────────────
        R("Research Office Type 1  53.21 m²",       20, 350, 295, 170, "office"),
        R("Research Office Type 2  64.91 m²",      325, 350, 365, 175, "office"),
        // ─── Vertical circulation ─────────────────────────────────
        R("Stairwell",                             700, 415, 110, 145, "stair"),
        R("Elevator Core",                         820, 415, 130, 145, "elevator"),
        // ─── NW wet service column (stacked above Level 1) ────────
        R("Ladies' Toilet  14.30 m²",               20, 530, 130, 100, "toilet"),
        R("Gent's Toilet  12.40 m²",               160, 530, 115, 100, "toilet"),
        R("Disabled Toilet  4.41 m²",              285, 530,  80, 100, "toilet"),
        R("Janitor Room  4.35 m²",                 375, 530,  78, 100, "service"),
        // ─── Circulation ──────────────────────────────────────────
        R("Core Corridor",                          20, 638, 960,  42, "corridor"),
      ]
    })),

    /* ── Level 5 — Heavy Robotics & AI Testing Arena ── */
    {
      label: "Level 5 — Heavy Robotics & AI Testing Arena",
      rooms: [
        // ─── Massive single-volume testing field ──────────────────
        R("Primary Robotics & AI Testing Field  1,766.94 m²",
                                                    20,  60, 820, 460, "lab"),
        // ─── Isolation lobby separating lab from elevator core ────
        R("Central Floor Lobby  115.00 m²",        850,  60, 130, 295, "lobby"),
        // ─── Vertical circulation ─────────────────────────────────
        R("Stairwell",                             850, 365, 110, 115, "stair"),
        R("Elevator Core",                         850, 490, 130, 110, "elevator"),
        // ─── NW wet service column (top of vertical stack) ────────
        R("Ladies' Toilet  14.30 m²",               20, 530, 130,  90, "toilet"),
        R("Gent's Toilet  12.40 m²",               160, 530, 115,  90, "toilet"),
        R("Disabled Toilet  4.41 m²",              285, 530,  80,  90, "toilet"),
        R("Janitor Room  4.35 m²",                 375, 530,  78,  90, "service"),
        // ─── Circulation ──────────────────────────────────────────
        R("Main Corridor",                          20, 630, 960,  50, "corridor"),
      ]
    }
  ],

  /* ── Block C: HPC & Big Data Analytics (−1.2, −1.1, Ground–Floor 5) ── */
  C: [
    // Underground parking levels (-1.2 and -1.1, generated below)
    ...[-1.2, -1.1].map((lvl, li) => ({
      label: `Level ${lvl} — Underground Parking ${li === 0 ? "(Lower)" : "(Upper)"}`,
      rooms: [
        R(li === 0 ? "Vehicle Ramp — Descent from Level −1.1" : "Vehicle Ramp Entry (from Ground)",
                                                  20,  60, 200, 170, "ramp"),
        R("Enclosed Parking Field — Slots #1–61",  20, 240, 960, 400, "parking"),
        // 63 representative slots in a 7×9 grid (first 61 shown)
        ...(() => {
          const slots = [];
          for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 9; col++) {
              const n = row * 9 + col + 1;
              if (n > 61) break;
              slots.push(R(`#${n}`, 28 + col * 104, 250 + row * 54, 96, 46, "parkslot"));
            }
          }
          return slots;
        })()
      ]
    })),
    // Ground–5: HPC computing floors (all identical)
    ...Array.from({ length: 6 }, (_, i) => ({
      label: i === 0 ? "Ground Floor — HPC Computing" : `Floor ${i} — HPC Computing`,
      rooms: [
        R("HPC Computing Laboratory  1,067 m²",    20,  60, 710, 380, "lab"),
        R("Primary E-W Corridor  65 m",             20, 448, 710,  65, "corridor"),
        R("Secondary N-S Corridor  92 m",           730,  60,  70, 520, "corridor"),
        R("Stairwell (N)",                          810,  60, 130, 165, "stair"),
        R("Elevator Core",                          810, 235, 130, 165, "elevator"),
        R("Stairwell (S)",                          810, 410, 130, 165, "stair"),
        R("Ladies' Restroom  14 m²",                20, 523, 140,  90, "toilet"),
        R("Gents' Restroom  12 m²",                170, 523, 130,  90, "toilet"),
        R("Disabled WC  4 m²",                     310, 523,  85,  90, "toilet"),
        R("Janitor Room  4 m²",                    405, 523,  80,  90, "service"),
        R("Balcony E  8 m²",                       810, 585, 170,  75, "balcony"),
        R("Balcony W  8 m²",                        20, 620, 130,  60, "balcony"),
      ]
    }))
  ],

  /* ── Block F: Sustainable Energy Technology (Ground – Floor 6) ── */
  F: Array.from({ length: 7 }, (_, i) => ({
    label: i === 0 ? "Ground Floor" : `Floor ${i}`,
    rooms: [
      R("Sustainable Energy Research Laboratory  1,080 m²", 20,  60, 680, 390, "lab"),
      R("Technical Reference Library  121 m²",    710,  60, 270, 210, "library"),
      R("Briefing & Meeting Room  113 m²",         710, 280, 270, 170, "meeting"),
      R("Main Circulation Hallway  65 m²",          20, 460, 680,  70, "corridor"),
      R("Gas Shaft ↑",                             710, 460,  90,  70, "shaft"),
      R("Electrical Riser ↑",                      810, 460,  90,  70, "shaft"),
      R("SN Duct ↑",                               910, 460,  70,  70, "shaft"),
      R("Ladies' Toilet  14 m²",                    20, 540, 145, 100, "toilet"),
      R("Gents' Toilet  12 m²",                    175, 540, 135, 100, "toilet"),
      R("Disabled WC  4 m²",                       320, 540,  90, 100, "toilet"),
      R("Janitor  4 m²",                           420, 540,  85, 100, "service"),
      R("Escape Balcony  16 m²",                   515, 540, 125, 100, "balcony"),
      R("Elevator Core",                           710, 540, 110, 110, "elevator"),
      R("Stairwell",                               830, 540, 150, 110, "stair"),
    ]
  })),

  /* ── Block G: Nuclear Reactor Excellence Center (Ground + Floors 1–3) ── */
  G: [
    {
      label: "Ground Floor — Assembly, Library & Lobby",
      rooms: [
        R("Main Level Lobby  123 m²",               20,  60, 305, 240, "lobby"),
        R("Executive Meeting Room  108 m²",         335,  60, 290, 240, "meeting"),
        R("Reactor Library  119 m²",                635,  60, 345, 240, "library"),
        R("Main Thoroughfare Corridor",              20, 310, 960,  70, "corridor"),
        R("Stairwell (W)",                           20, 390, 115, 160, "stair"),
        R("Elevator Core",                          145, 390, 115, 160, "elevator"),
        R("Gas Shaft Riser ↑",                      270, 390,  80, 160, "shaft"),
        R("Electrical Shaft Riser ↑",               360, 390,  80, 160, "shaft"),
        R("SN/ME Shaft ↑",                          450, 390,  80, 160, "shaft"),
        R("Ladies' Toilet  14 m²",                  540, 390, 135,  95, "toilet"),
        R("Gents' Toilet  12 m²",                   685, 390, 125,  95, "toilet"),
        R("Disabled WC  4 m²",                      820, 390,  85,  95, "toilet"),
        R("Janitor  4 m²",                          915, 390,  65,  95, "service"),
        R("Stairwell (E)",                          865, 558, 115, 130, "stair"),
      ]
    },
    ...Array.from({ length: 3 }, (_, i) => ({
      label: `Floor ${i + 1} — Researcher Offices`,
      rooms: [
        R("Office A  44 m²",   20,  60, 155, 185, "office"),
        R("Office B  43 m²",  185,  60, 155, 185, "office"),
        R("Office C  42 m²",  350,  60, 155, 185, "office"),
        R("Office D  44 m²",  515,  60, 155, 185, "office"),
        R("Office E  42 m²",  680,  60, 155, 185, "office"),
        R("Wrap-around Balcony  27 m²", 845, 60, 135, 185, "balcony"),
        R("Central Corridor",  20, 255, 960,  70, "corridor"),
        R("Office F  43 m²",   20, 335, 155, 185, "office"),
        R("Office G  44 m²",  185, 335, 155, 185, "office"),
        R("Office H  42 m²",  350, 335, 155, 185, "office"),
        R("Gas Shaft ↑",       515, 335,  80, 155, "shaft"),
        R("Electrical Shaft ↑",605, 335,  80, 155, "shaft"),
        R("SN/ME Shaft ↑",     695, 335,  80, 155, "shaft"),
        R("Ladies'  14 m²",    785, 335, 130,  90, "toilet"),
        R("Gents'  12 m²",     785, 435, 130,  90, "toilet"),
        R("Disabled WC  4 m²", 925, 335,  55,  90, "toilet"),
        R("Janitor  4 m²",     925, 435,  55,  90, "service"),
        R("Stairwell (W)",      20, 528, 115, 132, "stair"),
        R("Elevator Core",     145, 528, 115, 132, "elevator"),
        R("Exterior Balcony  27 m²", 270, 528, 210, 132, "balcony"),
      ]
    }))
  ]
};

// ── Map floor index → floor label ──────────────────────────────────────────
function getFloorLabel(blockId, floorIdx) {
  return BLOCK_FLOOR_PLANS[blockId]?.[floorIdx]?.label || `Floor ${floorIdx}`;
}

// ── Build/refresh the tab strip for the selected block ─────────────────────
function buildFloorTabs(bi) {
  const block = CAMPUS_BLOCKS[bi];
  const plans = BLOCK_FLOOR_PLANS[block?.id];
  const tabsEl = document.getElementById("floorTabs");
  if (!tabsEl || !plans) return;
  tabsEl.innerHTML = plans.map((plan, i) => {
    const short = plan.label.replace(/ — .*/, ""); // trim long subtitle
    return `<button class="${i === 0 ? "is-active" : ""}" data-floor="${i}">${short}</button>`;
  }).join("");
  tabsEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => selectFloor(parseInt(btn.dataset.floor, 10)));
  });
}

// ── Activate a floor: update tabs, step label, prev/next, SVG ─────────────
function selectFloor(idx) {
  floorState.floorIdx = idx;
  const block = CAMPUS_BLOCKS[floorState.blockIdx];
  const plans = BLOCK_FLOOR_PLANS[block?.id];

  // Sync tab active state
  const tabsEl = document.getElementById("floorTabs");
  if (tabsEl) tabsEl.querySelectorAll("button").forEach((btn, i) =>
    btn.classList.toggle("is-active", i === idx));

  // Update stepper label
  const stepLabel = document.getElementById("floorStepLabel");
  if (stepLabel && plans) stepLabel.textContent = plans[idx]?.label || "";

  // Update prev / next button states
  const prevBtn = document.getElementById("floorPrevBtn");
  const nextBtn = document.getElementById("floorNextBtn");
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = !plans || idx >= plans.length - 1;

  // Render the floor plan SVG
  renderFloorDetailSVG(block?.id, idx);
}

// ── Room type → dark-theme fill / stroke ───────────────────────────────────
const FP_STYLE = {
  lobby:    { fill: "rgba(59,130,246,0.22)",  stroke: "#3b82f6" },
  lab:      { fill: "rgba(16,185,129,0.22)",  stroke: "#10b981" },
  office:   { fill: "rgba(245,158,11,0.22)",  stroke: "#f59e0b" },
  corridor: { fill: "rgba(148,163,184,0.14)", stroke: "#64748b" },
  stair:    { fill: "rgba(124,58,237,0.25)",  stroke: "#7c3aed" },
  elevator: { fill: "rgba(6,182,212,0.25)",   stroke: "#06b6d4" },
  toilet:   { fill: "rgba(236,72,153,0.18)",  stroke: "#ec4899" },
  service:  { fill: "rgba(120,113,108,0.22)", stroke: "#78716c" },
  meeting:  { fill: "rgba(234,179,8,0.22)",   stroke: "#eab308" },
  library:  { fill: "rgba(168,85,247,0.22)",  stroke: "#a855f7" },
  parking:  { fill: "rgba(99,102,241,0.16)",  stroke: "#6366f1" },
  parkslot: { fill: "rgba(99,102,241,0.08)",  stroke: "#4f46e5" },
  ramp:     { fill: "rgba(234,179,8,0.28)",   stroke: "#ca8a04" },
  shaft:    { fill: "rgba(239,68,68,0.25)",   stroke: "#ef4444" },
  balcony:  { fill: "rgba(52,211,153,0.18)",  stroke: "#34d399" },
  bridge:   { fill: "rgba(14,165,233,0.22)",  stroke: "#0ea5e9" },
};

// ── Draw floor plan into #buildingMap SVG (pure DOM — no innerHTML) ─────────
function renderFloorDetailSVG(blockId, floorIdx) {
  const plans = BLOCK_FLOOR_PLANS[blockId];
  if (!plans) return;
  const plan = plans[floorIdx];
  if (!plan) return;
  const svg = document.getElementById("buildingMap");
  if (!svg) return;

  // Wipe previous content completely
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // ── defs (filter) ─────────────────────────────────────────────────────────
  const defs = svgElement("defs");
  const filt = svgElement("filter", { id: "fpGlow" });
  filt.appendChild(svgElement("feGaussianBlur", { stdDeviation: "4", result: "b" }));
  const merge = svgElement("feMerge");
  merge.appendChild(svgElement("feMergeNode", { in: "b" }));
  merge.appendChild(svgElement("feMergeNode", { in: "SourceGraphic" }));
  filt.appendChild(merge);
  defs.appendChild(filt);
  svg.appendChild(defs);

  // ── dark background ────────────────────────────────────────────────────────
  svg.appendChild(svgElement("rect", { x: 0, y: 0, width: 1000, height: 680, fill: "#0f172a" }));

  // ── floor title ───────────────────────────────────────────────────────────
  svg.appendChild(svgElement("text", {
    x: 500, y: 38,
    "text-anchor": "middle", "dominant-baseline": "middle",
    fill: "#94a3b8", "font-size": "13",
    "font-family": "Inter,sans-serif", "font-weight": "600"
  }, `Block ${blockId}  ·  ${plan.label}`));

  // ── rooms ─────────────────────────────────────────────────────────────────
  const legendLabels = {
    lobby:"Lobby", lab:"Laboratory", office:"Office", corridor:"Corridor",
    stair:"Stairwell", elevator:"Elevator", toilet:"Sanitary", service:"Service",
    meeting:"Meeting", library:"Library", parking:"Parking", ramp:"Ramp",
    shaft:"Shaft/Duct", balcony:"Balcony", bridge:"Bridge", parkslot:"Slot"
  };

  for (const room of plan.rooms) {
    const style = FP_STYLE[room.type] || FP_STYLE.service;

    svg.appendChild(svgElement("rect", {
      x: room.x, y: room.y, width: room.w, height: room.h,
      rx: 3,
      fill: style.fill,
      stroke: style.stroke,
      "stroke-width": room.type === "parkslot" ? 0.8 : 1.4,
    }));

    // Labels
    if (room.type === "parkslot") {
      if (room.w >= 28 && room.h >= 14) {
        svg.appendChild(svgElement("text", {
          x: room.x + room.w / 2, y: room.y + room.h / 2,
          "text-anchor": "middle", "dominant-baseline": "middle",
          fill: "#93c5fd", "font-size": "7.5", "font-family": "Inter,monospace"
        }, room.name));
      }
    } else if (room.w >= 46 && room.h >= 20) {
      // Split "Name  XX m²" into two lines
      const sepIdx = room.name.indexOf("  ");
      const mainText = sepIdx > 0 ? room.name.slice(0, sepIdx) : room.name;
      const areaText = sepIdx > 0 ? room.name.slice(sepIdx + 2) : "";
      const hasArea  = areaText.length > 0 && room.h >= 44;
      const twoLines = hasArea || (mainText.length > 20 && room.h >= 44);

      const wrapAt = 20;
      const lineA = mainText.length > wrapAt && !hasArea
        ? mainText.slice(0, mainText.lastIndexOf(" ", wrapAt) || wrapAt)
        : mainText;
      const lineB = !hasArea && mainText.length > wrapAt
        ? mainText.slice((mainText.lastIndexOf(" ", wrapAt) || wrapAt) + 1)
        : areaText;

      const cx = room.x + room.w / 2;
      const cy = room.y + room.h / 2;
      const lineH = 12;

      if (twoLines && lineB) {
        svg.appendChild(svgElement("text", {
          x: cx, y: cy - lineH / 2,
          "text-anchor": "middle", "dominant-baseline": "middle",
          fill: "#f1f5f9", "font-size": "9.5", "font-family": "Inter,sans-serif", "font-weight": "500"
        }, lineA.length > 24 ? lineA.slice(0, 22) + "…" : lineA));
        svg.appendChild(svgElement("text", {
          x: cx, y: cy + lineH / 2 + 1,
          "text-anchor": "middle", "dominant-baseline": "middle",
          fill: hasArea ? style.stroke : "#cbd5e1",
          "font-size": hasArea ? "8.5" : "9", "font-family": "Inter,sans-serif"
        }, lineB));
      } else {
        svg.appendChild(svgElement("text", {
          x: cx, y: cy,
          "text-anchor": "middle", "dominant-baseline": "middle",
          fill: "#f1f5f9", "font-size": "9.5", "font-family": "Inter,sans-serif", "font-weight": "500"
        }, lineA.length > 26 ? lineA.slice(0, 24) + "…" : lineA));
      }
    }
  }

  // ── legend ────────────────────────────────────────────────────────────────
  const usedTypes = [...new Set(plan.rooms.map(r => r.type).filter(t => t !== "parkslot"))];
  let lx = 14;
  for (const type of usedTypes) {
    const style  = FP_STYLE[type] || FP_STYLE.service;
    const label  = legendLabels[type] || type;
    svg.appendChild(svgElement("rect", {
      x: lx, y: 654, width: 10, height: 10, rx: 2,
      fill: style.fill, stroke: style.stroke, "stroke-width": "1"
    }));
    svg.appendChild(svgElement("text", {
      x: lx + 13, y: 663,
      fill: "#94a3b8", "font-size": "9", "font-family": "Inter,sans-serif"
    }, label));
    lx += label.length * 5.6 + 22;
    if (lx > 960) break;
  }
}

const HEAT_STOPS = [
  [0,    [10, 120, 255]],
  [0.22, [0,  210, 180]],
  [0.45, [60, 255,  60]],
  [0.65, [255,220,   0]],
  [0.82, [255,100,   0]],
  [1,    [255,  0,  80]]
];

function heatRgb(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [t0, c0] = HEAT_STOPS[i - 1];
    const [t1, c1] = HEAT_STOPS[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1][1];
}

function heatCss(t, alpha) {
  const [r, g, b] = heatRgb(t);
  return alpha !== undefined ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

const campusState = {
  metric: "usage",
  hoveredBlock: null,
  selectedBlock: null,
  liveActive: false,
  liveRaf: null,
  liveOffsets: CAMPUS_BLOCKS.map(() => Math.random() * Math.PI * 2),
  liveTick: 0
};

function getBlockMetricValue(block, metric, noise) {
  const base = block[metric];
  if (!campusState.liveActive) return base;
  const wave = Math.sin(campusState.liveTick * 0.04 + noise) * 0.07;
  return Math.max(0.1, Math.min(1, base + wave));
}

function metricLabel(metric) {
  return { usage: "AR Sessions", dwell: "Dwell Time", qr: "QR Density", success: "Route Success" }[metric] || metric;
}

function metricValueStr(block, metric) {
  if (metric === "usage")   return `${block.sessions.toLocaleString()} sessions`;
  if (metric === "dwell")   return formatDuration(block.avgDwell);
  if (metric === "qr")      return `${block.qrCount} codes`;
  if (metric === "success") return `${block.successRate}%`;
  return "";
}

function polygonCentroid(pts) {
  let x = 0, y = 0;
  pts.forEach(([px, py]) => { x += px; y += py; });
  return [x / pts.length, y / pts.length];
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function scaleShape(shape, sx, sy) {
  return shape.map(([x, y]) => [x * sx, y * sy]);
}

function drawCampusCanvas() {
  const canvas = document.getElementById("campusCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const sx = W / 780, sy = H / 460;

  ctx.clearRect(0, 0, W, H);

  // Background — dark campus ground
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, H);

  // Ground grid lines (subtle)
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 40 * sx) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 40 * sy) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Campus boundary
  ctx.strokeStyle = "rgba(102,87,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(18 * sx, 28 * sy, (752 - 18) * sx, (432 - 28) * sy);
  ctx.setLineDash([]);

  // Connector corridors linking corner blocks to central hub H
  // Drawn BEFORE block fills so blocks render on top
  const corridors = [
    // F (right edge x=215, y=148-205) → H (left edge x=215)  — already touching, draw a seam glow
    // B left edge x=558 ↔ H right edge x=558 — seam
    // G right edge x=215 ↔ H left at y=298-328
    // C left edge x=558 ↔ H right at y=268-328
    { x1:215, y1:148, x2:215, y2:205 }, // F↔H left seam
    { x1:558, y1:148, x2:558, y2:248 }, // B↔H right seam
    { x1:215, y1:298, x2:215, y2:328 }, // G↔H left seam
    { x1:558, y1:268, x2:558, y2:328 }  // C↔H right seam
  ];
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 6 * Math.min(sx, sy);
  corridors.forEach(c => {
    ctx.beginPath();
    ctx.moveTo(c.x1 * sx, c.y1 * sy);
    ctx.lineTo(c.x2 * sx, c.y2 * sy);
    ctx.stroke();
  });

  CAMPUS_BLOCKS.forEach((block, bi) => {
    const pts = scaleShape(block.shape, sx, sy);
    const val = getBlockMetricValue(block, campusState.metric, campusState.liveOffsets[bi]);
    const isHovered = campusState.hoveredBlock === bi;
    const isSelected = campusState.selectedBlock === bi;
    const [cx, cy] = polygonCentroid(pts);

    // Heat glow (radial gradient overlay)
    const glowR = Math.max(
      ...pts.map(([px, py]) => Math.hypot(px - cx, py - cy))
    ) * 1.6;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grd.addColorStop(0, heatCss(val, 0.55));
    grd.addColorStop(0.6, heatCss(val, 0.20));
    grd.addColorStop(1, heatCss(val, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    pts.forEach(([px, py], pi) => pi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fill();

    // Block fill
    ctx.fillStyle = heatCss(val, isHovered || isSelected ? 0.72 : 0.52);
    ctx.beginPath();
    pts.forEach(([px, py], pi) => pi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fill();

    // Block stroke
    ctx.strokeStyle = isSelected
      ? "#fff"
      : isHovered
        ? heatCss(val, 0.95)
        : heatCss(val, 0.6);
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.2;
    ctx.beginPath();
    pts.forEach(([px, py], pi) => pi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.stroke();

    // Block label
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 6;
    const lines = block.label.split("\n");
    ctx.font = `bold ${Math.round(10 * Math.min(sx, sy))}px Inter,sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lh = 13 * Math.min(sx, sy);
    lines.forEach((ln, li) => {
      ctx.fillText(ln, cx, cy + (li - (lines.length - 1) / 2) * lh);
    });
    ctx.restore();

    // Heat value pill
    const pval = Math.round(val * 100);
    ctx.save();
    ctx.font = `${Math.round(8 * Math.min(sx, sy))}px Inter,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const pilTop = pts.reduce((mn, [, py]) => Math.min(mn, py), Infinity) - 14 * sy;
    ctx.fillStyle = heatCss(val, 0.9);
    const tw = ctx.measureText(`${pval}%`).width + 8 * sx;
    const pr = 4 * sy, px = cx - tw / 2, py2 = pilTop - 6 * sy, pw = tw, ph = 12 * sy;
    ctx.beginPath();
    ctx.moveTo(px + pr, py2);
    ctx.lineTo(px + pw - pr, py2);
    ctx.arcTo(px + pw, py2, px + pw, py2 + pr, pr);
    ctx.lineTo(px + pw, py2 + ph - pr);
    ctx.arcTo(px + pw, py2 + ph, px + pw - pr, py2 + ph, pr);
    ctx.lineTo(px + pr, py2 + ph);
    ctx.arcTo(px, py2 + ph, px, py2 + ph - pr, pr);
    ctx.lineTo(px, py2 + pr);
    ctx.arcTo(px, py2, px + pr, py2, pr);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(`${pval}%`, cx, pilTop);
    ctx.restore();
  });
}

function campusHoveredBlockFromEvent(e) {
  const canvas = document.getElementById("campusCanvas");
  if (!canvas) return -1;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top)  * sy;
  const csx = canvas.width  / 780;
  const csy = canvas.height / 460;
  for (let i = CAMPUS_BLOCKS.length - 1; i >= 0; i--) {
    if (pointInPolygon(mx, my, scaleShape(CAMPUS_BLOCKS[i].shape, csx, csy))) return i;
  }
  return -1;
}

function updateCampusInspector(bi) {
  const block = bi >= 0 ? CAMPUS_BLOCKS[bi] : null;
  const titleEl = document.getElementById("cinspTitle");
  const subEl   = document.getElementById("cinspSub");
  if (titleEl) titleEl.textContent = block ? `Block ${block.id} — ${block.label.split("\n")[1] || ""}` : "Campus Overview";
  if (subEl)   subEl.textContent   = block ? block.description : "Hover or click a block to inspect";

  const liveEl  = document.getElementById("campusLiveUsers");
  const sessEl  = document.getElementById("campusSessions");
  const succEl  = document.getElementById("campusAvgSuccess");
  if (block) {
    const v = getBlockMetricValue(block, campusState.metric, campusState.liveOffsets[bi] || 0);
    if (liveEl)  liveEl.textContent  = Math.round(block.sessions * v * 0.08).toLocaleString();
    if (sessEl)  sessEl.textContent  = block.sessions.toLocaleString();
    if (succEl)  succEl.textContent  = `${block.successRate}%`;
  } else {
    const total = CAMPUS_BLOCKS.reduce((s, b) => s + b.sessions, 0);
    const avgSuc = Math.round(CAMPUS_BLOCKS.reduce((s, b) => s + b.successRate, 0) / CAMPUS_BLOCKS.length);
    const live   = Math.round(total * 0.05);
    if (liveEl)  liveEl.textContent  = live.toLocaleString();
    if (sessEl)  sessEl.textContent  = total.toLocaleString();
    if (succEl)  succEl.textContent  = `${avgSuc}%`;
  }
}

function renderCinspBlockList() {
  const el = document.getElementById("cinspBlockList");
  if (!el) return;
  el.innerHTML = CAMPUS_BLOCKS.map((block, bi) => {
    const val = getBlockMetricValue(block, campusState.metric, campusState.liveOffsets[bi]);
    const [r, g, b] = heatRgb(val);
    return `
      <div class="cinsp-block-item" data-bi="${bi}">
        <div class="cinsp-block-dot" style="background:rgb(${r},${g},${b})"></div>
        <span class="cinsp-block-name">Block ${block.id}</span>
        <span class="cinsp-block-val">${metricValueStr(block, campusState.metric)}</span>
      </div>`;
  }).join("");
  el.querySelectorAll(".cinsp-block-item").forEach(item => {
    item.addEventListener("click", () => {
      const bi = parseInt(item.dataset.bi, 10);
      drillIntoBlock(bi);
    });
  });
}

function renderCampusBlockGrid() {
  const el = document.getElementById("campusBlockGrid");
  if (!el) return;
  el.innerHTML = CAMPUS_BLOCKS.map((block, bi) => {
    const val = block[campusState.metric];
    const pct = Math.round(val * 100);
    const [r, g, b] = heatRgb(val);
    return `
      <div class="campus-block-card" data-bi="${bi}">
        <div class="cbc-name">Block ${block.id} — ${block.label.split("\n")[1] || ""}</div>
        <div class="cbc-bar-wrap">
          <div class="cbc-bar" style="width:${pct}%;background:rgb(${r},${g},${b})"></div>
        </div>
        <div class="cbc-meta">
          <span>${metricValueStr(block, campusState.metric)}</span>
          <span>${pct}%</span>
        </div>
      </div>`;
  }).join("");
  el.querySelectorAll(".campus-block-card").forEach(card => {
    card.addEventListener("click", () => {
      showView("dashboard");
      drillIntoBlock(parseInt(card.dataset.bi, 10));
    });
  });
}

// Track whether floor detail is currently open so renderMap() won't clobber it
let floorViewOpen = false;

function drillIntoBlock(bi) {
  campusState.selectedBlock = bi;
  floorState.blockIdx = bi;
  floorState.floorIdx = 0;
  floorViewOpen = true;
  const block = CAMPUS_BLOCKS[bi];
  const campusView = document.getElementById("campusView");
  const floorView  = document.getElementById("floorDetailView");
  const lbl        = document.getElementById("floorBlockLabel");
  if (campusView) campusView.style.display = "none";
  if (floorView)  floorView.style.display  = "block";
  if (lbl)        lbl.textContent = `Block ${block.id} — ${block.label.split("\n")[1] || ""}`;
  buildFloorTabs(bi);
  selectFloor(0);
  drawCampusCanvas();
}

function backToCampusView() {
  campusState.selectedBlock = null;
  floorViewOpen = false;
  const campusView = document.getElementById("campusView");
  const floorView  = document.getElementById("floorDetailView");
  if (campusView) campusView.style.display = "block";
  if (floorView)  floorView.style.display  = "none";
  drawCampusCanvas();
  updateCampusInspector(-1);
}

function startLiveAnimation() {
  function tick() {
    campusState.liveTick++;
    drawCampusCanvas();
    renderCinspBlockList();
    if (campusState.hoveredBlock >= 0) updateCampusInspector(campusState.hoveredBlock);
    if (campusState.liveActive) campusState.liveRaf = requestAnimationFrame(tick);
  }
  campusState.liveRaf = requestAnimationFrame(tick);
}

function stopLiveAnimation() {
  if (campusState.liveRaf) {
    cancelAnimationFrame(campusState.liveRaf);
    campusState.liveRaf = null;
  }
}

function initCampusHeatMap() {
  const canvas = document.getElementById("campusCanvas");
  if (!canvas) return;

  // Mouse interactions
  canvas.addEventListener("mousemove", e => {
    const bi = campusHoveredBlockFromEvent(e);
    if (bi !== campusState.hoveredBlock) {
      campusState.hoveredBlock = bi;
      canvas.style.cursor = bi >= 0 ? "pointer" : "crosshair";
      drawCampusCanvas();
      updateCampusInspector(bi);
    }
  });

  canvas.addEventListener("mouseleave", () => {
    campusState.hoveredBlock = -1;
    canvas.style.cursor = "crosshair";
    drawCampusCanvas();
    updateCampusInspector(-1);
  });

  canvas.addEventListener("click", e => {
    const bi = campusHoveredBlockFromEvent(e);
    if (bi >= 0) drillIntoBlock(bi);
  });

  // Metric switcher
  const metricCtrl = document.getElementById("hmapMetricCtrl");
  if (metricCtrl) {
    metricCtrl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        metricCtrl.querySelectorAll("button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        campusState.metric = btn.dataset.hmetric;
        drawCampusCanvas();
        renderCinspBlockList();
        renderCampusBlockGrid();
        updateCampusInspector(campusState.hoveredBlock >= 0 ? campusState.hoveredBlock : -1);
      });
    });
  }

  // Live toggle
  const liveBtn = document.getElementById("hmapLiveBtn");
  if (liveBtn) {
    liveBtn.addEventListener("click", () => {
      campusState.liveActive = !campusState.liveActive;
      liveBtn.textContent = campusState.liveActive ? "⏹ Stop" : "▶ Live";
      liveBtn.classList.toggle("is-live", campusState.liveActive);
      if (campusState.liveActive) startLiveAnimation();
      else stopLiveAnimation();
    });
  }

  // Back to campus
  const backBtn = document.getElementById("backToCampus");
  if (backBtn) backBtn.addEventListener("click", backToCampusView);

  // Prev / Next floor buttons
  const prevFloorBtn = document.getElementById("floorPrevBtn");
  const nextFloorBtn = document.getElementById("floorNextBtn");
  if (prevFloorBtn) {
    prevFloorBtn.addEventListener("click", () => {
      if (floorState.floorIdx > 0) selectFloor(floorState.floorIdx - 1);
    });
  }
  if (nextFloorBtn) {
    nextFloorBtn.addEventListener("click", () => {
      const block = CAMPUS_BLOCKS[floorState.blockIdx];
      const plans = BLOCK_FLOOR_PLANS[block?.id];
      if (plans && floorState.floorIdx < plans.length - 1) selectFloor(floorState.floorIdx + 1);
    });
  }

  // Keyboard arrow navigation while floor detail is visible
  document.addEventListener("keydown", e => {
    const floorView = document.getElementById("floorDetailView");
    if (!floorView || floorView.style.display === "none") return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const block = CAMPUS_BLOCKS[floorState.blockIdx];
      const plans = BLOCK_FLOOR_PLANS[block?.id];
      if (plans && floorState.floorIdx < plans.length - 1) selectFloor(floorState.floorIdx + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      if (floorState.floorIdx > 0) selectFloor(floorState.floorIdx - 1);
    } else if (e.key === "Escape") {
      backToCampusView();
    }
  });

  // Initial render
  drawCampusCanvas();
  updateCampusInspector(-1);
  renderCinspBlockList();
  renderCampusBlockGrid();
}

// Hook into page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCampusHeatMap);
} else {
  initCampusHeatMap();
}
