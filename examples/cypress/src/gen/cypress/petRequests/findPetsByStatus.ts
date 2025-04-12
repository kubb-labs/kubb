import type { FindPetsByStatusQueryResponse } from '../../models/FindPetsByStatus.ts'

export function findPetsByStatus(): Cypress.Chainable<FindPetsByStatusQueryResponse> {
  return cy.request('get', 'http://localhost:3000/pet/findByStatus', undefined).then((res: Cypress.Response<FindPetsByStatusQueryResponse>) => res.body)
}
