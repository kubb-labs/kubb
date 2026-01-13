import type { GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'

export function getPetById(petId: GetPetByIdPathParams['petId'], options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetPetByIdQueryResponse> {
  return cy
    .request<GetPetByIdQueryResponse>({
      method: 'get',
      url: `/pet/${petId}:search`,
      ...options,
    })
    .then((res) => res.body)
}
