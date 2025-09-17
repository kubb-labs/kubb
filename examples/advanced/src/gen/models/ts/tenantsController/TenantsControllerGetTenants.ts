import type { Tenant } from '../Tenant.ts'

export type TenantsControllerGetTenants200 = Tenant[]

export type TenantsControllerGetTenantsQueryResponse = TenantsControllerGetTenants200

export type TenantsControllerGetTenantsQuery = {
  Response: TenantsControllerGetTenants200
  Errors: any
}
