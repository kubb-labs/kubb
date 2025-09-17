import type { License } from '../License.ts'
import type { UpdateLicenseDto } from '../UpdateLicenseDto.ts'

export type LicensesControllerUpdateLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type LicensesControllerUpdateLicense200 = License

export type LicensesControllerUpdateLicenseMutationRequest = UpdateLicenseDto

export type LicensesControllerUpdateLicenseMutationResponse = LicensesControllerUpdateLicense200

export type LicensesControllerUpdateLicenseMutation = {
  Response: LicensesControllerUpdateLicense200
  Request: LicensesControllerUpdateLicenseMutationRequest
  PathParams: LicensesControllerUpdateLicensePathParams
  Errors: any
}
