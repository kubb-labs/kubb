import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../models/UpdatePet.ts'

export function updatePet(data: UpdatePetMutationRequest): Cypress.Chainable<UpdatePetMutationResponse> {
  return cy.request('put', 'http://localhost:3000/pet', data).then((res: Cypress.Response<UpdatePetMutationResponse>) => res.body)
}
