import type { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTags(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<FindPetsByTagsQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/pet/findByTags',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<FindPetsByTagsQueryResponse>) => res.body)
}
