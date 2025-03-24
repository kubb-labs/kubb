import type { AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet.ts'

export function addPet(data: AddPetMutationRequest): Cypress.Chainable<AddPetMutationResponse> {
  return cy.request('post', 'http://localhost:3000/pet', data).then((res: Cypress.Response<AddPetMutationResponse>) => res.body)
}
