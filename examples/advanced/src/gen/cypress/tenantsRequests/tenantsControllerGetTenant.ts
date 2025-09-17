import type { TenantsControllerGetTenantQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenant.ts'

export function tenantsControllerGetTenant(): Cypress.Chainable<TenantsControllerGetTenantQueryResponse> {
  return cy.request('get', '/api/tenants/:id', undefined).then((res: Cypress.Response<TenantsControllerGetTenantQueryResponse>) => res.body)
}
