import type { ResellersControllerGetResellersQueryResponse } from '../../models/ts/resellersController/ResellersControllerGetResellers.ts'

export function resellersControllerGetResellers(): Cypress.Chainable<ResellersControllerGetResellersQueryResponse> {
  return cy.request('get', '/api/resellers', undefined).then((res: Cypress.Response<ResellersControllerGetResellersQueryResponse>) => res.body)
}
