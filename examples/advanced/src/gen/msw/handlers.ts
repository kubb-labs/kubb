import { appControllerGetStatusHandler } from './appController/appControllerGetStatusHandler.ts'
import { licensesControllerActivateLicenseHandler } from './licensesController/licensesControllerActivateLicenseHandler.ts'
import { licensesControllerCreateLicenseHandler } from './licensesController/licensesControllerCreateLicenseHandler.ts'
import { licensesControllerDeactivateLicenseHandler } from './licensesController/licensesControllerDeactivateLicenseHandler.ts'
import { licensesControllerDeleteLicenseHandler } from './licensesController/licensesControllerDeleteLicenseHandler.ts'
import { licensesControllerGetLicenseHandler } from './licensesController/licensesControllerGetLicenseHandler.ts'
import { licensesControllerGetLicensesHandler } from './licensesController/licensesControllerGetLicensesHandler.ts'
import { licensesControllerUpdateLicenseHandler } from './licensesController/licensesControllerUpdateLicenseHandler.ts'
import { partsControllerDownloadPartHandler } from './partsController/partsControllerDownloadPartHandler.ts'
import { partsControllerGetPartHandler } from './partsController/partsControllerGetPartHandler.ts'
import { partsControllerGetPartsHandler } from './partsController/partsControllerGetPartsHandler.ts'
import { partsControllerSimulatePartHandler } from './partsController/partsControllerSimulatePartHandler.ts'
import { resellersControllerCreateResellerHandler } from './resellersController/resellersControllerCreateResellerHandler.ts'
import { resellersControllerGetResellerHandler } from './resellersController/resellersControllerGetResellerHandler.ts'
import { resellersControllerGetResellersHandler } from './resellersController/resellersControllerGetResellersHandler.ts'
import { resellersControllerUpdateResellerHandler } from './resellersController/resellersControllerUpdateResellerHandler.ts'
import { tenantsControllerCreateTenantHandler } from './tenantsController/tenantsControllerCreateTenantHandler.ts'
import { tenantsControllerGetActiveLicenseHandler } from './tenantsController/tenantsControllerGetActiveLicenseHandler.ts'
import { tenantsControllerGetActiveWeldPackHandler } from './tenantsController/tenantsControllerGetActiveWeldPackHandler.ts'
import { tenantsControllerGetTenantHandler } from './tenantsController/tenantsControllerGetTenantHandler.ts'
import { tenantsControllerGetTenantsHandler } from './tenantsController/tenantsControllerGetTenantsHandler.ts'
import { tenantsControllerGetWeldCreditsHandler } from './tenantsController/tenantsControllerGetWeldCreditsHandler.ts'
import { tenantsControllerUpdateTenantHandler } from './tenantsController/tenantsControllerUpdateTenantHandler.ts'
import { weldPacksControllerActivateWeldPackHandler } from './weldPacksController/weldPacksControllerActivateWeldPackHandler.ts'
import { weldPacksControllerCreateWeldPackHandler } from './weldPacksController/weldPacksControllerCreateWeldPackHandler.ts'
import { weldPacksControllerDeactivateLicenseHandler } from './weldPacksController/weldPacksControllerDeactivateLicenseHandler.ts'
import { weldPacksControllerDeleteWeldPackHandler } from './weldPacksController/weldPacksControllerDeleteWeldPackHandler.ts'
import { weldPacksControllerGetWeldPackHandler } from './weldPacksController/weldPacksControllerGetWeldPackHandler.ts'
import { weldPacksControllerGetWeldPacksHandler } from './weldPacksController/weldPacksControllerGetWeldPacksHandler.ts'
import { weldPacksControllerUpdateWeldPackHandler } from './weldPacksController/weldPacksControllerUpdateWeldPackHandler.ts'

export const handlers = [
  appControllerGetStatusHandler(),
  licensesControllerGetLicensesHandler(),
  licensesControllerCreateLicenseHandler(),
  licensesControllerGetLicenseHandler(),
  licensesControllerUpdateLicenseHandler(),
  licensesControllerDeleteLicenseHandler(),
  licensesControllerActivateLicenseHandler(),
  licensesControllerDeactivateLicenseHandler(),
  resellersControllerGetResellersHandler(),
  resellersControllerCreateResellerHandler(),
  resellersControllerGetResellerHandler(),
  resellersControllerUpdateResellerHandler(),
  tenantsControllerGetTenantsHandler(),
  tenantsControllerCreateTenantHandler(),
  tenantsControllerGetTenantHandler(),
  tenantsControllerUpdateTenantHandler(),
  tenantsControllerGetActiveLicenseHandler(),
  tenantsControllerGetActiveWeldPackHandler(),
  tenantsControllerGetWeldCreditsHandler(),
  weldPacksControllerGetWeldPacksHandler(),
  weldPacksControllerCreateWeldPackHandler(),
  weldPacksControllerGetWeldPackHandler(),
  weldPacksControllerUpdateWeldPackHandler(),
  weldPacksControllerDeleteWeldPackHandler(),
  weldPacksControllerActivateWeldPackHandler(),
  weldPacksControllerDeactivateLicenseHandler(),
  partsControllerGetPartsHandler(),
  partsControllerGetPartHandler(),
  partsControllerDownloadPartHandler(),
  partsControllerSimulatePartHandler(),
] as const
