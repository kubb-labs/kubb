export type LicensesControllerDeleteLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type LicensesControllerDeleteLicense200 = boolean

export type LicensesControllerDeleteLicenseMutationResponse = LicensesControllerDeleteLicense200

export type LicensesControllerDeleteLicenseMutation = {
  Response: LicensesControllerDeleteLicense200
  PathParams: LicensesControllerDeleteLicensePathParams
  Errors: any
}
