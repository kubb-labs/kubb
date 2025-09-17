import type {
  TenantsControllerCreateTenantMutationRequest,
  TenantsControllerCreateTenantMutationResponse,
} from '../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'

export function tenantsControllerCreateTenant(
  data: TenantsControllerCreateTenantMutationRequest,
): Cypress.Chainable<TenantsControllerCreateTenantMutationResponse> {
  return cy.request('post', '/api/tenants', data).then((res: Cypress.Response<TenantsControllerCreateTenantMutationResponse>) => res.body)
}
