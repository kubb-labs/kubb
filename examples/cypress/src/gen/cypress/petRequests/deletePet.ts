import type { DeletePetMutationResponse } from '../../models/DeletePet.ts'

export function deletePet(): Cypress.Chainable<DeletePetMutationResponse> {
  return cy.request('delete', 'http://localhost:3000/pet/:petId', undefined).then((res: Cypress.Response<DeletePetMutationResponse>) => res.body)
}
