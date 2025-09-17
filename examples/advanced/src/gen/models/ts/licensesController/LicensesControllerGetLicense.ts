import type { GetLicenseResponse } from '../GetLicenseResponse.ts'

export type LicensesControllerGetLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type LicensesControllerGetLicense200 = GetLicenseResponse

export type LicensesControllerGetLicenseQueryResponse = LicensesControllerGetLicense200

export type LicensesControllerGetLicenseQuery = {
  Response: LicensesControllerGetLicense200
  PathParams: LicensesControllerGetLicensePathParams
  Errors: any
}
