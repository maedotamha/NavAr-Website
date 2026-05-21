const repo = require('./infrastructure/repositories/navRepository');
const createCatalogService = require('./application/services/catalogService');
const createDashboardService = require('./application/services/dashboardService');
const createMobileSyncService = require('./application/services/mobileSyncService');
const createNavigationService = require('./application/services/navigationService');
const createAuthService = require('./application/services/authService');
const createAccessControlService = require('./application/services/accessControlService');
const createSidebarService = require('./application/services/sidebarService');
const createOutdoorNavigationService = require('./application/services/outdoorNavigationService');
const createCatalogController = require('./interfaces/http/controllers/catalogController');
const createDashboardController = require('./interfaces/http/controllers/dashboardController');
const createMobileController = require('./interfaces/http/controllers/mobileController');
const createNavigationController = require('./interfaces/http/controllers/navigationController');
const createAuthController = require('./interfaces/http/controllers/authController');
const createAccessControlController = require('./interfaces/http/controllers/accessControlController');
const createSidebarController = require('./interfaces/http/controllers/sidebarController');
const createOutdoorNavigationController = require('./interfaces/http/controllers/outdoorNavigationController');
const catalogService = createCatalogService(repo);
const dashboardService = createDashboardService(repo);
const mobileService = createMobileSyncService(repo);
const navigationService = createNavigationService(repo);
const authService = createAuthService(repo);
const accessControlService = createAccessControlService(repo);
const sidebarService = createSidebarService();
const outdoorNavigationService = createOutdoorNavigationService();
module.exports = {
  catalogController: createCatalogController(catalogService),
  dashboardController: createDashboardController(dashboardService),
  mobileController: createMobileController(mobileService),
  navigationController: createNavigationController(navigationService),
  authController: createAuthController(authService),
  accessControlController: createAccessControlController(accessControlService),
  sidebarController: createSidebarController(sidebarService),
  outdoorNavigationController: createOutdoorNavigationController(outdoorNavigationService)
};
