import type { GetPetByIdResponseData, GetPetByIdPathParams } from '../../models/ts/petController/GetPetById.ts'

export function getPetById(petId: GetPetByIdPathParams['petId'], options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<GetPetByIdResponseData> {
  return cy
    .request<GetPetByIdResponseData>({
      method: 'get',
      url: `/pet/${petId}:search`,
      ...options,
    })
    .then((res) => res.body)
}
