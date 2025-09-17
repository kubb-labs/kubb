import type { TenantsControllerGetWeldCreditsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'

export function tenantsControllerGetWeldCredits(): Cypress.Chainable<TenantsControllerGetWeldCreditsQueryResponse> {
  return cy.request('get', '/api/tenants/:id/weld-credits', undefined).then((res: Cypress.Response<TenantsControllerGetWeldCreditsQueryResponse>) => res.body)
}
