import type { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTags(): Cypress.Chainable<FindPetsByTagsQueryResponse> {
  return cy.request('get', '/pet/findByTags', undefined).then((res: Cypress.Response<FindPetsByTagsQueryResponse>) => res.body)
}
