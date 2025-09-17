import type { Tenant } from '../Tenant.ts'
import type { UpdateTenantDto } from '../UpdateTenantDto.ts'

export type TenantsControllerUpdateTenantPathParams = {
  /**
   * @type number
   */
  id: number
}

export type TenantsControllerUpdateTenant200 = Tenant

export type TenantsControllerUpdateTenantMutationRequest = UpdateTenantDto

export type TenantsControllerUpdateTenantMutationResponse = TenantsControllerUpdateTenant200

export type TenantsControllerUpdateTenantMutation = {
  Response: TenantsControllerUpdateTenant200
  Request: TenantsControllerUpdateTenantMutationRequest
  PathParams: TenantsControllerUpdateTenantPathParams
  Errors: any
}
