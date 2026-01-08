import type { AddPetRequestData, AddPetResponseData } from '../../models/ts/petController/AddPet.ts'

export function addPet(data: AddPetRequestData, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<AddPetResponseData> {
  return cy
    .request<AddPetResponseData>({
      method: 'post',
      url: '/pet',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
