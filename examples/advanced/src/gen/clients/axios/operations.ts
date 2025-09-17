export const operations = {
  AppController_getStatus: {
    path: '/api/status',
    method: 'get',
  },
  LicensesController_getLicenses: {
    path: '/api/licenses',
    method: 'get',
  },
  LicensesController_createLicense: {
    path: '/api/licenses',
    method: 'post',
  },
  LicensesController_getLicense: {
    path: '/api/licenses/:id',
    method: 'get',
  },
  LicensesController_updateLicense: {
    path: '/api/licenses/:id',
    method: 'patch',
  },
  LicensesController_deleteLicense: {
    path: '/api/licenses/:id',
    method: 'delete',
  },
  LicensesController_activateLicense: {
    path: '/api/licenses/:id/activate',
    method: 'post',
  },
  LicensesController_deactivateLicense: {
    path: '/api/licenses/:id/deactivate',
    method: 'post',
  },
  ResellersController_getResellers: {
    path: '/api/resellers',
    method: 'get',
  },
  ResellersController_createReseller: {
    path: '/api/resellers',
    method: 'post',
  },
  ResellersController_getReseller: {
    path: '/api/resellers/:id',
    method: 'get',
  },
  ResellersController_updateReseller: {
    path: '/api/resellers/:id',
    method: 'patch',
  },
  TenantsController_getTenants: {
    path: '/api/tenants',
    method: 'get',
  },
  TenantsController_createTenant: {
    path: '/api/tenants',
    method: 'post',
  },
  TenantsController_getTenant: {
    path: '/api/tenants/:id',
    method: 'get',
  },
  TenantsController_updateTenant: {
    path: '/api/tenants/:id',
    method: 'patch',
  },
  TenantsController_getActiveLicense: {
    path: '/api/tenants/:id/active-license',
    method: 'get',
  },
  TenantsController_getActiveWeldPack: {
    path: '/api/tenants/:id/active-weldpack',
    method: 'get',
  },
  TenantsController_getWeldCredits: {
    path: '/api/tenants/:id/weld-credits',
    method: 'get',
  },
  WeldPacksController_getWeldPacks: {
    path: '/api/weldpacks',
    method: 'get',
  },
  WeldPacksController_createWeldPack: {
    path: '/api/weldpacks',
    method: 'post',
  },
  WeldPacksController_getWeldPack: {
    path: '/api/weldpacks/:id',
    method: 'get',
  },
  WeldPacksController_updateWeldPack: {
    path: '/api/weldpacks/:id',
    method: 'patch',
  },
  WeldPacksController_deleteWeldPack: {
    path: '/api/weldpacks/:id',
    method: 'delete',
  },
  WeldPacksController_activateWeldPack: {
    path: '/api/weldpacks/:id/activate',
    method: 'post',
  },
  WeldPacksController_deactivateLicense: {
    path: '/api/weldpacks/:id/deactivate',
    method: 'post',
  },
  PartsController_getParts: {
    path: '/api/parts',
    method: 'get',
  },
  PartsController_getPart: {
    path: '/api/parts/:urn',
    method: 'get',
  },
  PartsController_downloadPart: {
    path: '/api/parts/:urn/download',
    method: 'post',
  },
  PartsController_simulatePart: {
    path: '/api/parts/:urn/simulate',
    method: 'post',
  },
} as const
