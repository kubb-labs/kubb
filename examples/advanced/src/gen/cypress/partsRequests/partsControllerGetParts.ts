import type { PartsControllerGetPartsQueryResponse } from '../../models/ts/partsController/PartsControllerGetParts.ts'

export function partsControllerGetParts(): Cypress.Chainable<PartsControllerGetPartsQueryResponse> {
  return cy.request('get', '/api/parts', undefined).then((res: Cypress.Response<PartsControllerGetPartsQueryResponse>) => res.body)
}
