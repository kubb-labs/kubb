import type { License } from '../License.ts'

export type LicensesControllerGetLicenses200 = License[]

export type LicensesControllerGetLicensesQueryResponse = LicensesControllerGetLicenses200

export type LicensesControllerGetLicensesQuery = {
  Response: LicensesControllerGetLicenses200
  Errors: any
}
