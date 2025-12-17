import type { AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'

export function addPet(data: AddPetMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<AddPetMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/pet',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<AddPetMutationResponse>) => res.body)
}
