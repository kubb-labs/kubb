import type { ResellersControllerGetResellerQueryResponse } from '../../models/ts/resellersController/ResellersControllerGetReseller.ts'

export function resellersControllerGetReseller(): Cypress.Chainable<ResellersControllerGetResellerQueryResponse> {
  return cy.request('get', '/api/resellers/:id', undefined).then((res: Cypress.Response<ResellersControllerGetResellerQueryResponse>) => res.body)
}
