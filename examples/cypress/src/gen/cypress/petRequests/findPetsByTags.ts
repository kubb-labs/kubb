import type { FindPetsByTagsQueryResponse } from '../../models/FindPetsByTags.ts'

export function findPetsByTags(): Cypress.Chainable<FindPetsByTagsQueryResponse> {
  return cy.request('get', 'http://localhost:3000/pet/findByTags', undefined).then((res: Cypress.Response<FindPetsByTagsQueryResponse>) => res.body)
}
