import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet.ts'

export function updatePet(data: UpdatePetMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<UpdatePetMutationResponse> {
  return cy
    .request<UpdatePetMutationResponse>({
      method: 'put',
      url: '/pet',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
