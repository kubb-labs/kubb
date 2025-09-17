import { appControllerGetStatusHandler } from './appRequests/appControllerGetStatus.ts'
import { licensesControllerActivateLicenseHandler } from './licensesRequests/licensesControllerActivateLicense.ts'
import { licensesControllerCreateLicenseHandler } from './licensesRequests/licensesControllerCreateLicense.ts'
import { licensesControllerDeactivateLicenseHandler } from './licensesRequests/licensesControllerDeactivateLicense.ts'
import { licensesControllerDeleteLicenseHandler } from './licensesRequests/licensesControllerDeleteLicense.ts'
import { licensesControllerGetLicenseHandler } from './licensesRequests/licensesControllerGetLicense.ts'
import { licensesControllerGetLicensesHandler } from './licensesRequests/licensesControllerGetLicenses.ts'
import { licensesControllerUpdateLicenseHandler } from './licensesRequests/licensesControllerUpdateLicense.ts'
import { partsControllerDownloadPartHandler } from './partsRequests/partsControllerDownloadPart.ts'
import { partsControllerGetPartHandler } from './partsRequests/partsControllerGetPart.ts'
import { partsControllerGetPartsHandler } from './partsRequests/partsControllerGetParts.ts'
import { partsControllerSimulatePartHandler } from './partsRequests/partsControllerSimulatePart.ts'
import { resellersControllerCreateResellerHandler } from './resellersRequests/resellersControllerCreateReseller.ts'
import { resellersControllerGetResellerHandler } from './resellersRequests/resellersControllerGetReseller.ts'
import { resellersControllerGetResellersHandler } from './resellersRequests/resellersControllerGetResellers.ts'
import { resellersControllerUpdateResellerHandler } from './resellersRequests/resellersControllerUpdateReseller.ts'
import { tenantsControllerCreateTenantHandler } from './tenantsRequests/tenantsControllerCreateTenant.ts'
import { tenantsControllerGetActiveLicenseHandler } from './tenantsRequests/tenantsControllerGetActiveLicense.ts'
import { tenantsControllerGetActiveWeldPackHandler } from './tenantsRequests/tenantsControllerGetActiveWeldPack.ts'
import { tenantsControllerGetTenantHandler } from './tenantsRequests/tenantsControllerGetTenant.ts'
import { tenantsControllerGetTenantsHandler } from './tenantsRequests/tenantsControllerGetTenants.ts'
import { tenantsControllerGetWeldCreditsHandler } from './tenantsRequests/tenantsControllerGetWeldCredits.ts'
import { tenantsControllerUpdateTenantHandler } from './tenantsRequests/tenantsControllerUpdateTenant.ts'
import { weldPacksControllerActivateWeldPackHandler } from './weldPacksRequests/weldPacksControllerActivateWeldPack.ts'
import { weldPacksControllerCreateWeldPackHandler } from './weldPacksRequests/weldPacksControllerCreateWeldPack.ts'
import { weldPacksControllerDeactivateLicenseHandler } from './weldPacksRequests/weldPacksControllerDeactivateLicense.ts'
import { weldPacksControllerDeleteWeldPackHandler } from './weldPacksRequests/weldPacksControllerDeleteWeldPack.ts'
import { weldPacksControllerGetWeldPackHandler } from './weldPacksRequests/weldPacksControllerGetWeldPack.ts'
import { weldPacksControllerGetWeldPacksHandler } from './weldPacksRequests/weldPacksControllerGetWeldPacks.ts'
import { weldPacksControllerUpdateWeldPackHandler } from './weldPacksRequests/weldPacksControllerUpdateWeldPack.ts'
import {
  licensesControllerActivateLicenseMutationRequestSchema,
  licensesControllerActivateLicensePathParamsSchema,
} from '../zod/licensesController/licensesControllerActivateLicenseSchema.ts'
import { licensesControllerCreateLicenseMutationRequestSchema } from '../zod/licensesController/licensesControllerCreateLicenseSchema.ts'
import { licensesControllerDeactivateLicensePathParamsSchema } from '../zod/licensesController/licensesControllerDeactivateLicenseSchema.ts'
import { licensesControllerDeleteLicensePathParamsSchema } from '../zod/licensesController/licensesControllerDeleteLicenseSchema.ts'
import { licensesControllerGetLicensePathParamsSchema } from '../zod/licensesController/licensesControllerGetLicenseSchema.ts'
import {
  licensesControllerUpdateLicenseMutationRequestSchema,
  licensesControllerUpdateLicensePathParamsSchema,
} from '../zod/licensesController/licensesControllerUpdateLicenseSchema.ts'
import {
  partsControllerDownloadPartMutationRequestSchema,
  partsControllerDownloadPartPathParamsSchema,
} from '../zod/partsController/partsControllerDownloadPartSchema.ts'
import { partsControllerGetPartPathParamsSchema } from '../zod/partsController/partsControllerGetPartSchema.ts'
import {
  partsControllerSimulatePartMutationRequestSchema,
  partsControllerSimulatePartPathParamsSchema,
} from '../zod/partsController/partsControllerSimulatePartSchema.ts'
import { resellersControllerCreateResellerMutationRequestSchema } from '../zod/resellersController/resellersControllerCreateResellerSchema.ts'
import { resellersControllerGetResellerPathParamsSchema } from '../zod/resellersController/resellersControllerGetResellerSchema.ts'
import {
  resellersControllerUpdateResellerMutationRequestSchema,
  resellersControllerUpdateResellerPathParamsSchema,
} from '../zod/resellersController/resellersControllerUpdateResellerSchema.ts'
import { tenantsControllerCreateTenantMutationRequestSchema } from '../zod/tenantsController/tenantsControllerCreateTenantSchema.ts'
import { tenantsControllerGetActiveLicensePathParamsSchema } from '../zod/tenantsController/tenantsControllerGetActiveLicenseSchema.ts'
import { tenantsControllerGetActiveWeldPackPathParamsSchema } from '../zod/tenantsController/tenantsControllerGetActiveWeldPackSchema.ts'
import { tenantsControllerGetTenantPathParamsSchema } from '../zod/tenantsController/tenantsControllerGetTenantSchema.ts'
import { tenantsControllerGetWeldCreditsPathParamsSchema } from '../zod/tenantsController/tenantsControllerGetWeldCreditsSchema.ts'
import {
  tenantsControllerUpdateTenantMutationRequestSchema,
  tenantsControllerUpdateTenantPathParamsSchema,
} from '../zod/tenantsController/tenantsControllerUpdateTenantSchema.ts'
import {
  weldPacksControllerActivateWeldPackMutationRequestSchema,
  weldPacksControllerActivateWeldPackPathParamsSchema,
} from '../zod/weldPacksController/weldPacksControllerActivateWeldPackSchema.ts'
import { weldPacksControllerCreateWeldPackMutationRequestSchema } from '../zod/weldPacksController/weldPacksControllerCreateWeldPackSchema.ts'
import { weldPacksControllerDeactivateLicensePathParamsSchema } from '../zod/weldPacksController/weldPacksControllerDeactivateLicenseSchema.ts'
import { weldPacksControllerDeleteWeldPackPathParamsSchema } from '../zod/weldPacksController/weldPacksControllerDeleteWeldPackSchema.ts'
import { weldPacksControllerGetWeldPackPathParamsSchema } from '../zod/weldPacksController/weldPacksControllerGetWeldPackSchema.ts'
import {
  weldPacksControllerUpdateWeldPackMutationRequestSchema,
  weldPacksControllerUpdateWeldPackPathParamsSchema,
} from '../zod/weldPacksController/weldPacksControllerUpdateWeldPackSchema.ts'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'

export const server = new McpServer({
  name: 'Receipt AI',
  version: '3.0.0',
})

server.tool('AppController_getStatus', 'Make a GET request to /api/status', async () => {
  return appControllerGetStatusHandler()
})

server.tool('LicensesController_getLicenses', 'Make a GET request to /api/licenses', async () => {
  return licensesControllerGetLicensesHandler()
})

server.tool(
  'LicensesController_createLicense',
  'Make a POST request to /api/licenses',
  { data: licensesControllerCreateLicenseMutationRequestSchema },
  async ({ data }) => {
    return licensesControllerCreateLicenseHandler({ data })
  },
)

server.tool(
  'LicensesController_getLicense',
  'Make a GET request to /api/licenses/{id}',
  { id: licensesControllerGetLicensePathParamsSchema.shape['id'] },
  async ({ id }) => {
    return licensesControllerGetLicenseHandler({ id })
  },
)

server.tool(
  'LicensesController_updateLicense',
  'Make a PATCH request to /api/licenses/{id}',
  { id: licensesControllerUpdateLicensePathParamsSchema.shape['id'], data: licensesControllerUpdateLicenseMutationRequestSchema },
  async ({ id, data }) => {
    return licensesControllerUpdateLicenseHandler({ id, data })
  },
)

server.tool(
  'LicensesController_deleteLicense',
  'Make a DELETE request to /api/licenses/{id}',
  { id: licensesControllerDeleteLicensePathParamsSchema.shape['id'] },
  async ({ id }) => {
    return licensesControllerDeleteLicenseHandler({ id })
  },
)

server.tool(
  'LicensesController_activateLicense',
  'Make a POST request to /api/licenses/{id}/activate',
  { id: licensesControllerActivateLicensePathParamsSchema.shape['id'], data: licensesControllerActivateLicenseMutationRequestSchema },
  async ({ id, data }) => {
    return licensesControllerActivateLicenseHandler({ id, data })
  },
)

server.tool(
  'LicensesController_deactivateLicense',
  'Make a POST request to /api/licenses/{id}/deactivate',
  { id: licensesControllerDeactivateLicensePathParamsSchema.shape['id'] },
  async ({ id }) => {
    return licensesControllerDeactivateLicenseHandler({ id })
  },
)

server.tool('ResellersController_getResellers', 'Make a GET request to /api/resellers', async () => {
  return resellersControllerGetResellersHandler()
})

server.tool(
  'ResellersController_createReseller',
  'Make a POST request to /api/resellers',
  { data: resellersControllerCreateResellerMutationRequestSchema },
  async ({ data }) => {
    return resellersControllerCreateResellerHandler({ data })
  },
)

server.tool(
  'ResellersController_getReseller',
  'Make a GET request to /api/resellers/{id}',
  { id: resellersControllerGetResellerPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return resellersControllerGetResellerHandler({ id })
  },
)

server.tool(
  'ResellersController_updateReseller',
  'Make a PATCH request to /api/resellers/{id}',
  { id: resellersControllerUpdateResellerPathParamsSchema.shape['id'], data: resellersControllerUpdateResellerMutationRequestSchema },
  async ({ id, data }) => {
    return resellersControllerUpdateResellerHandler({ id, data })
  },
)

server.tool('TenantsController_getTenants', 'Make a GET request to /api/tenants', async () => {
  return tenantsControllerGetTenantsHandler()
})

server.tool(
  'TenantsController_createTenant',
  'Make a POST request to /api/tenants',
  { data: tenantsControllerCreateTenantMutationRequestSchema },
  async ({ data }) => {
    return tenantsControllerCreateTenantHandler({ data })
  },
)

server.tool(
  'TenantsController_getTenant',
  'Make a GET request to /api/tenants/{id}',
  { id: tenantsControllerGetTenantPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return tenantsControllerGetTenantHandler({ id })
  },
)

server.tool(
  'TenantsController_updateTenant',
  'Make a PATCH request to /api/tenants/{id}',
  { id: tenantsControllerUpdateTenantPathParamsSchema.shape['id'], data: tenantsControllerUpdateTenantMutationRequestSchema },
  async ({ id, data }) => {
    return tenantsControllerUpdateTenantHandler({ id, data })
  },
)

server.tool(
  'TenantsController_getActiveLicense',
  'Make a GET request to /api/tenants/{id}/active-license',
  { id: tenantsControllerGetActiveLicensePathParamsSchema.shape['id'] },
  async ({ id }) => {
    return tenantsControllerGetActiveLicenseHandler({ id })
  },
)

server.tool(
  'TenantsController_getActiveWeldPack',
  'Make a GET request to /api/tenants/{id}/active-weldpack',
  { id: tenantsControllerGetActiveWeldPackPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return tenantsControllerGetActiveWeldPackHandler({ id })
  },
)

server.tool(
  'TenantsController_getWeldCredits',
  'Make a GET request to /api/tenants/{id}/weld-credits',
  { id: tenantsControllerGetWeldCreditsPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return tenantsControllerGetWeldCreditsHandler({ id })
  },
)

server.tool('WeldPacksController_getWeldPacks', 'Make a GET request to /api/weldpacks', async () => {
  return weldPacksControllerGetWeldPacksHandler()
})

server.tool(
  'WeldPacksController_createWeldPack',
  'Make a POST request to /api/weldpacks',
  { data: weldPacksControllerCreateWeldPackMutationRequestSchema },
  async ({ data }) => {
    return weldPacksControllerCreateWeldPackHandler({ data })
  },
)

server.tool(
  'WeldPacksController_getWeldPack',
  'Make a GET request to /api/weldpacks/{id}',
  { id: weldPacksControllerGetWeldPackPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return weldPacksControllerGetWeldPackHandler({ id })
  },
)

server.tool(
  'WeldPacksController_updateWeldPack',
  'Make a PATCH request to /api/weldpacks/{id}',
  { id: weldPacksControllerUpdateWeldPackPathParamsSchema.shape['id'], data: weldPacksControllerUpdateWeldPackMutationRequestSchema },
  async ({ id, data }) => {
    return weldPacksControllerUpdateWeldPackHandler({ id, data })
  },
)

server.tool(
  'WeldPacksController_deleteWeldPack',
  'Make a DELETE request to /api/weldpacks/{id}',
  { id: weldPacksControllerDeleteWeldPackPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return weldPacksControllerDeleteWeldPackHandler({ id })
  },
)

server.tool(
  'WeldPacksController_activateWeldPack',
  'Make a POST request to /api/weldpacks/{id}/activate',
  { id: weldPacksControllerActivateWeldPackPathParamsSchema.shape['id'], data: weldPacksControllerActivateWeldPackMutationRequestSchema },
  async ({ id, data }) => {
    return weldPacksControllerActivateWeldPackHandler({ id, data })
  },
)

server.tool(
  'WeldPacksController_deactivateLicense',
  'Make a POST request to /api/weldpacks/{id}/deactivate',
  { id: weldPacksControllerDeactivateLicensePathParamsSchema.shape['id'] },
  async ({ id }) => {
    return weldPacksControllerDeactivateLicenseHandler({ id })
  },
)

server.tool('PartsController_getParts', 'Make a GET request to /api/parts', async () => {
  return partsControllerGetPartsHandler()
})

server.tool(
  'PartsController_getPart',
  'Make a GET request to /api/parts/{urn}',
  { urn: partsControllerGetPartPathParamsSchema.shape['urn'] },
  async ({ urn }) => {
    return partsControllerGetPartHandler({ urn })
  },
)

server.tool(
  'PartsController_downloadPart',
  'Make a POST request to /api/parts/{urn}/download',
  { urn: partsControllerDownloadPartPathParamsSchema.shape['urn'], data: partsControllerDownloadPartMutationRequestSchema },
  async ({ urn, data }) => {
    return partsControllerDownloadPartHandler({ urn, data })
  },
)

server.tool(
  'PartsController_simulatePart',
  'Make a POST request to /api/parts/{urn}/simulate',
  { urn: partsControllerSimulatePartPathParamsSchema.shape['urn'], data: partsControllerSimulatePartMutationRequestSchema },
  async ({ urn, data }) => {
    return partsControllerSimulatePartHandler({ urn, data })
  },
)

async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
