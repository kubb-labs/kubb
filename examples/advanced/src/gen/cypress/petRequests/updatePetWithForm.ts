import type { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm.ts'

export function updatePetWithForm(): Cypress.Chainable<UpdatePetWithFormMutationResponse> {
  return cy.request('post', '/pet/:petId\\:search', undefined).then((res: Cypress.Response<UpdatePetWithFormMutationResponse>) => res.body)
}
