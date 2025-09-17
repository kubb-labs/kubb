import type { TenantsControllerGetTenantsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenants.ts'

export function tenantsControllerGetTenants(): Cypress.Chainable<TenantsControllerGetTenantsQueryResponse> {
  return cy.request('get', '/api/tenants', undefined).then((res: Cypress.Response<TenantsControllerGetTenantsQueryResponse>) => res.body)
}
