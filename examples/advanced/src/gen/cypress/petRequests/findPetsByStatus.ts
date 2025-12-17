import type { FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus.ts'

export function findPetsByStatus(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<FindPetsByStatusQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/pet/findByStatus/:step_id',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<FindPetsByStatusQueryResponse>) => res.body)
}
