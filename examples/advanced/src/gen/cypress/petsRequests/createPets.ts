import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../../models/ts/petsController/CreatePets.ts'

export function createPets(data: CreatePetsMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<CreatePetsMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/pets/:uuid',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<CreatePetsMutationResponse>) => res.body)
}
