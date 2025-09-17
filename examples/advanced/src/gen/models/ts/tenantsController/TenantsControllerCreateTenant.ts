import type { CreateTenantDto } from '../CreateTenantDto.ts'
import type { Tenant } from '../Tenant.ts'

export type TenantsControllerCreateTenant201 = Tenant

export type TenantsControllerCreateTenantMutationRequest = CreateTenantDto

export type TenantsControllerCreateTenantMutationResponse = TenantsControllerCreateTenant201

export type TenantsControllerCreateTenantMutation = {
  Response: TenantsControllerCreateTenant201
  Request: TenantsControllerCreateTenantMutationRequest
  Errors: any
}
