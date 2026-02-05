import type { FindPetsByStatusPathParams, FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'

export function findPetsByStatus(
  stepId: FindPetsByStatusPathParams['stepId'],
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<FindPetsByStatusQueryResponse> {
  return cy
    .request<FindPetsByStatusQueryResponse>({
      method: 'get',
      url: `/pet/findByStatus/${stepId}`,
      ...options,
    })
    .then((res) => res.body)
}
