import type { GetInventoryQueryResponse } from '../../models/ts/storeController/GetInventory.ts'

export function getInventory(): Cypress.Chainable<GetInventoryQueryResponse> {
  return cy.request('get', '/store/inventory', undefined).then((res: Cypress.Response<GetInventoryQueryResponse>) => res.body)
}
