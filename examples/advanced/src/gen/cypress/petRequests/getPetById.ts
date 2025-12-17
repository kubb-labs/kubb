import type { GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'

export function getPetById(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<GetPetByIdQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/pet/:petId\\:search',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<GetPetByIdQueryResponse>) => res.body)
}
