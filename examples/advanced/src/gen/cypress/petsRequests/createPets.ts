import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../../models/ts/petsController/CreatePets.ts'

export function createPets(data: CreatePetsMutationRequest): Cypress.Chainable<CreatePetsMutationResponse> {
  return cy.request('post', '/pets/:uuid', data).then((res: Cypress.Response<CreatePetsMutationResponse>) => res.body)
}
