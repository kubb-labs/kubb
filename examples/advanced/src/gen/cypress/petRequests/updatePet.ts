import type { UpdatePetRequestData, UpdatePetResponseData } from '../../models/ts/petController/UpdatePet.ts'

export function updatePet(data: UpdatePetRequestData, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<UpdatePetResponseData> {
  return cy
    .request<UpdatePetResponseData>({
      method: 'put',
      url: '/pet',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
