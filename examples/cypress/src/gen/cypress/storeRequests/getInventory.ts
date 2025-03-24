import type { GetInventoryQueryResponse } from '../../models/GetInventory.ts'

export function getInventory(): Cypress.Chainable<GetInventoryQueryResponse> {
  return cy.request('get', 'http://localhost:3000/store/inventory', undefined).then((res: Cypress.Response<GetInventoryQueryResponse>) => res.body)
}
