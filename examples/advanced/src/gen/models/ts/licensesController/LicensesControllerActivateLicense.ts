import type { ActivateLicenseDto } from '../ActivateLicenseDto.ts'
import type { License } from '../License.ts'

export type LicensesControllerActivateLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type LicensesControllerActivateLicense200 = License

export type LicensesControllerActivateLicenseMutationRequest = ActivateLicenseDto

export type LicensesControllerActivateLicenseMutationResponse = LicensesControllerActivateLicense200

export type LicensesControllerActivateLicenseMutation = {
  Response: LicensesControllerActivateLicense200
  Request: LicensesControllerActivateLicenseMutationRequest
  PathParams: LicensesControllerActivateLicensePathParams
  Errors: any
}
