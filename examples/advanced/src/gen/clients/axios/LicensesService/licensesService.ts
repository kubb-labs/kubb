import { licensesControllerActivateLicense } from './licensesControllerActivateLicense.ts'
import { licensesControllerCreateLicense } from './licensesControllerCreateLicense.ts'
import { licensesControllerDeactivateLicense } from './licensesControllerDeactivateLicense.ts'
import { licensesControllerDeleteLicense } from './licensesControllerDeleteLicense.ts'
import { licensesControllerGetLicense } from './licensesControllerGetLicense.ts'
import { licensesControllerGetLicenses } from './licensesControllerGetLicenses.ts'
import { licensesControllerUpdateLicense } from './licensesControllerUpdateLicense.ts'

export function licensesService() {
  return {
    licensesControllerGetLicenses,
    licensesControllerCreateLicense,
    licensesControllerGetLicense,
    licensesControllerUpdateLicense,
    licensesControllerDeleteLicense,
    licensesControllerActivateLicense,
    licensesControllerDeactivateLicense,
  }
}
