import type { DeletePetMutationResponse } from '../../models/ts/petController/DeletePet.ts'

export function deletePet(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<DeletePetMutationResponse> {
  return cy
    .request({
      method: 'delete',
      url: '/pet/:petId\\:search',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<DeletePetMutationResponse>) => res.body)
}
