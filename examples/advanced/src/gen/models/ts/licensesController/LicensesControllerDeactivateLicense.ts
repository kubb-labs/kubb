import type { License } from '../License.ts'

export type LicensesControllerDeactivateLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type LicensesControllerDeactivateLicense200 = License

export type LicensesControllerDeactivateLicenseMutationResponse = LicensesControllerDeactivateLicense200

export type LicensesControllerDeactivateLicenseMutation = {
  Response: LicensesControllerDeactivateLicense200
  PathParams: LicensesControllerDeactivateLicensePathParams
  Errors: any
}
