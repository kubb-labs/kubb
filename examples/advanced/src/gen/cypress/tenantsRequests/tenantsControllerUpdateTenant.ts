import type {
  TenantsControllerUpdateTenantMutationRequest,
  TenantsControllerUpdateTenantMutationResponse,
} from '../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'

export function tenantsControllerUpdateTenant(
  data: TenantsControllerUpdateTenantMutationRequest,
): Cypress.Chainable<TenantsControllerUpdateTenantMutationResponse> {
  return cy.request('patch', '/api/tenants/:id', data).then((res: Cypress.Response<TenantsControllerUpdateTenantMutationResponse>) => res.body)
}
