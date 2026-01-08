import type { FindPetsByStatusPathParams, FindPetsByStatusResponseData } from '../../models/ts/petController/FindPetsByStatus.ts'

export function findPetsByStatus(
  stepId: FindPetsByStatusPathParams['step_id'],
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<FindPetsByStatusResponseData> {
  return cy
    .request<FindPetsByStatusResponseData>({
      method: 'get',
      url: `/pet/findByStatus/${stepId}`,
      ...options,
    })
    .then((res) => res.body)
}
