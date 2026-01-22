import type { FindPetsByTagsHeaderParams, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTags(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByTagsQueryResponse> {
  return cy
    .request<FindPetsByTagsQueryResponse>({
      method: 'get',
      url: '/pet/findByTags',
      qs: params,
      headers,
      ...options,
    })
    .then((res) => res.body)
}
