import type { FindPetsByTagsHeaderParams, FindPetsByTagsQueryParams, FindPetsByTagsResponseData } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTags(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<FindPetsByTagsResponseData> {
  return cy
    .request<FindPetsByTagsResponseData>({
      method: 'get',
      url: '/pet/findByTags',
      qs: params,
      headers,
      ...options,
    })
    .then((res) => res.body)
}
