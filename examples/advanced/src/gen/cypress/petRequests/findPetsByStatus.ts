import type { FindPetsByStatusQueryResponse } from "../../models/ts/petController/FindPetsByStatus.ts";

export function findPetsByStatus(): Cypress.Chainable<FindPetsByStatusQueryResponse> {
  return cy.request('get', '/pet/findByStatus/:step_id', undefined).then((res: Cypress.Response<FindPetsByStatusQueryResponse>) => res.body)
}