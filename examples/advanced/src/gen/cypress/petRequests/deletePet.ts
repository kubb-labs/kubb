import type { DeletePetMutationResponse } from '../../models/ts/petController/DeletePet.ts'

export function deletePet(): Cypress.Chainable<DeletePetMutationResponse> {
  return cy.request('delete', '/pet/:petId', undefined).then((res: Cypress.Response<DeletePetMutationResponse>) => res.body)
}
