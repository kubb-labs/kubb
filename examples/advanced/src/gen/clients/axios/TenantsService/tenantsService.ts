import { tenantsControllerCreateTenant } from './tenantsControllerCreateTenant.ts'
import { tenantsControllerGetActiveLicense } from './tenantsControllerGetActiveLicense.ts'
import { tenantsControllerGetActiveWeldPack } from './tenantsControllerGetActiveWeldPack.ts'
import { tenantsControllerGetTenant } from './tenantsControllerGetTenant.ts'
import { tenantsControllerGetTenants } from './tenantsControllerGetTenants.ts'
import { tenantsControllerGetWeldCredits } from './tenantsControllerGetWeldCredits.ts'
import { tenantsControllerUpdateTenant } from './tenantsControllerUpdateTenant.ts'

export function tenantsService() {
  return {
    tenantsControllerGetTenants,
    tenantsControllerCreateTenant,
    tenantsControllerGetTenant,
    tenantsControllerUpdateTenant,
    tenantsControllerGetActiveLicense,
    tenantsControllerGetActiveWeldPack,
    tenantsControllerGetWeldCredits,
  }
}
