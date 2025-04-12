export function createPets(data: CreatePetsMutationRequest): Cypress.Chainable<CreatePetsMutationResponse> {
  return cy.request('post', '/pets', data).then((res: Cypress.Response<CreatePetsMutationResponse>) => res.body)
}
