import type { License } from '../License.ts'

export type TenantsControllerGetActiveLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type TenantsControllerGetActiveLicense200 = License

export type TenantsControllerGetActiveLicenseQueryResponse = TenantsControllerGetActiveLicense200

export type TenantsControllerGetActiveLicenseQuery = {
  Response: TenantsControllerGetActiveLicense200
  PathParams: TenantsControllerGetActiveLicensePathParams
  Errors: any
}
