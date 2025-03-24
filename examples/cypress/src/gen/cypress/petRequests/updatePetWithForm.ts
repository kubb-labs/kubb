import type { UpdatePetWithFormMutationResponse } from '../../models/UpdatePetWithForm.ts'

export function updatePetWithForm(): Cypress.Chainable<UpdatePetWithFormMutationResponse> {
  return cy.request('post', 'http://localhost:3000/pet/:petId', undefined).then((res: Cypress.Response<UpdatePetWithFormMutationResponse>) => res.body)
}
