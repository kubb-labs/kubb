import type { GetTenantResponse } from '../GetTenantResponse.ts'

export type TenantsControllerGetTenantPathParams = {
  /**
   * @type number
   */
  id: number
}

export type TenantsControllerGetTenant200 = GetTenantResponse

export type TenantsControllerGetTenantQueryResponse = TenantsControllerGetTenant200

export type TenantsControllerGetTenantQuery = {
  Response: TenantsControllerGetTenant200
  PathParams: TenantsControllerGetTenantPathParams
  Errors: any
}
