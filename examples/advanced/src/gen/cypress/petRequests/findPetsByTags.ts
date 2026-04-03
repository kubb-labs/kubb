import type { FindPetsByTagsQueryParams, FindPetsByTagsHeaderParams, FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTags(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByTagsQueryResponse> {
  return cy
    .request<FindPetsByTagsQueryResponse>({
      method: 'GET',
      url: '/pet/findByTags',
      qs: params,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined,
      ...options,
    })
    .then((res) => res.body)
}
