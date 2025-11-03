import type { AddPetMutationRequest, AddPetMutationResponse } from "../../models/ts/petController/AddPet.ts";

export function addPet(data: AddPetMutationRequest): Cypress.Chainable<AddPetMutationResponse> {
  return cy.request('post', '/pet', data).then((res: Cypress.Response<AddPetMutationResponse>) => res.body)
}