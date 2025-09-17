import type { PartsControllerGetPartQueryResponse } from '../../models/ts/partsController/PartsControllerGetPart.ts'

export function partsControllerGetPart(): Cypress.Chainable<PartsControllerGetPartQueryResponse> {
  return cy.request('get', '/api/parts/:urn', undefined).then((res: Cypress.Response<PartsControllerGetPartQueryResponse>) => res.body)
}
