import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet.ts'

export function updatePet(data: UpdatePetMutationRequest): Cypress.Chainable<UpdatePetMutationResponse> {
  return cy.request('put', '/pet', data).then((res: Cypress.Response<UpdatePetMutationResponse>) => res.body)
}
