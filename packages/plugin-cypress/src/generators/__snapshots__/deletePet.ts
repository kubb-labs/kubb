export function deletePetsPetid(): Cypress.Chainable<DeletePetsPetidMutationResponse> {
  return cy.request('delete', '/pets/:petId', undefined).then((res: Cypress.Response<DeletePetsPetidMutationResponse>) => res.body)
}
